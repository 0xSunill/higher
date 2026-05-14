"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    useWalletConnection,
    useSendTransaction,
} from "@solana/react-hooks";
import {
    getProgramDerivedAddress,
    getBytesEncoder,
    fetchEncodedAccount,
    createSolanaRpc,
    type Address,
} from "@solana/kit";
import {
    decodeGameState,
    type GameState,
} from "../generated/higher/accounts";
import {
    BECOME_KING_DISCRIMINATOR,
} from "../generated/higher/instructions/becomeKing";
import {
    getClaimPrizeInstructionDataEncoder,
} from "../generated/higher/instructions/claimPrize";
import {
    getInitializeGameInstructionDataEncoder,
} from "../generated/higher/instructions/initializeGame";
import { HIGHER_PROGRAM_ADDRESS } from "../generated/higher/programs";

const LAMPORTS_PER_SOL = 1_000_000_000n;
const SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111" as Address;
const DEFAULT_PUBKEY = "11111111111111111111111111111111";

// Multiplier options for the user
const MULTIPLIER_OPTIONS = [
    { label: "1.25x", bps: 12500 },
    { label: "1.5x", bps: 15000 },
    { label: "1.75x", bps: 17500 },
    { label: "2x", bps: 20000 },
    { label: "2.5x", bps: 25000 },
    { label: "3x", bps: 30000 },
];

// RPC for fetching account data
const rpc = createSolanaRpc("https://api.devnet.solana.com");

function formatAddress(address: string): string {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatSol(lamports: bigint): string {
    const sol = Number(lamports) / Number(LAMPORTS_PER_SOL);
    return sol.toFixed(4);
}

function formatCountdown(seconds: number): string {
    if (seconds <= 0) return "EXPIRED";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${String(m).padStart(2, "0")}m`);
    parts.push(`${String(s).padStart(2, "0")}s`);
    return parts.join(" ");
}

/**
 * Encode the become_king instruction data with the multiplier_bps argument.
 * Layout: [8-byte discriminator][8-byte u64 multiplier_bps (little-endian)]
 */
function encodeBecomeKingData(multiplierBps: number): Uint8Array {
    const data = new Uint8Array(16); // 8 discriminator + 8 u64
    data.set(BECOME_KING_DISCRIMINATOR, 0);
    // Encode u64 as little-endian
    const view = new DataView(data.buffer);
    view.setBigUint64(8, BigInt(multiplierBps), true); // little-endian
    return data;
}

export function GameCard() {
    const { wallet, status } = useWalletConnection();
    const { send, isSending } = useSendTransaction();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [gameStatePda, setGameStatePda] = useState<Address | null>(null);
    const [vaultPda, setVaultPda] = useState<Address | null>(null);
    const [countdown, setCountdown] = useState<number>(0);
    const [txStatus, setTxStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [gameExists, setGameExists] = useState(true);
    const [selectedMultiplier, setSelectedMultiplier] = useState(MULTIPLIER_OPTIONS[0]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const walletAddress = wallet?.account.address;

    // Derive PDAs
    useEffect(() => {
        async function derivePDAs() {
            const [gameState] = await getProgramDerivedAddress({
                programAddress: HIGHER_PROGRAM_ADDRESS,
                seeds: [
                    getBytesEncoder().encode(
                        new Uint8Array([103, 97, 109, 101, 95, 115, 116, 97, 116, 101]) // "game_state"
                    ),
                ],
            });
            const [vault] = await getProgramDerivedAddress({
                programAddress: HIGHER_PROGRAM_ADDRESS,
                seeds: [
                    getBytesEncoder().encode(
                        new Uint8Array([118, 97, 117, 108, 116]) // "vault"
                    ),
                ],
            });
            setGameStatePda(gameState);
            setVaultPda(vault);
        }
        derivePDAs();
    }, []);

    // Fetch game state
    const fetchGameState = useCallback(async () => {
        if (!gameStatePda) return;
        try {
            const account = await fetchEncodedAccount(rpc, gameStatePda);
            if (account.exists) {
                const decoded = decodeGameState(account);
                setGameState(decoded.data);
                setGameExists(true);
            } else {
                setGameState(null);
                setGameExists(false);
            }
        } catch (err) {
            console.error("Failed to fetch game state:", err);
            setGameExists(false);
        } finally {
            setLoading(false);
        }
    }, [gameStatePda]);

    // Poll game state every 5 seconds
    useEffect(() => {
        fetchGameState();
        const interval = setInterval(fetchGameState, 5000);
        return () => clearInterval(interval);
    }, [fetchGameState]);

    // Determine if the timer has started (end_time > 0 means timer is running)
    const hasKing =
        gameState?.currentKing && gameState.currentKing !== DEFAULT_PUBKEY;
    const timerStarted = gameState ? Number(gameState.endTime) > 0 : false;

    // Live countdown timer
    useEffect(() => {
        if (!gameState || !timerStarted) {
            setCountdown(0);
            return;
        }

        const updateCountdown = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = Number(gameState.endTime) - now;
            setCountdown(Math.max(0, remaining));
        };

        updateCountdown();
        intervalRef.current = setInterval(updateCountdown, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [gameState, timerStarted]);

    const isKing =
        walletAddress && gameState
            ? walletAddress === gameState.currentKing
            : false;
    const isExpired = timerStarted && countdown === 0 && gameState !== null;

    // Initialize game
    const handleInitialize = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda) return;
        try {
            setTxStatus("Building initialize transaction...");
            const instruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: walletAddress, role: 3 as const }, // WritableSigner
                    { address: gameStatePda, role: 1 as const }, // Writable
                    { address: vaultPda, role: 1 as const }, // Writable
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const }, // Readonly
                ],
                data: getInitializeGameInstructionDataEncoder().encode({}),
            };
            setTxStatus("Awaiting signature...");
            const signature = await send({ instructions: [instruction] });
            setTxStatus(`Game initialized! Tx: ${signature?.slice(0, 20)}...`);
            setTimeout(fetchGameState, 2000);
        } catch (err) {
            console.error("Initialize failed:", err);
            setTxStatus(
                `Error: ${err instanceof Error ? err.message : "Unknown error"}`
            );
        }
    }, [walletAddress, gameStatePda, vaultPda, send, fetchGameState]);

    // Become king with selected multiplier
    const handleBecomeKing = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda) return;
        try {
            setTxStatus(`Building transaction (${selectedMultiplier.label} multiplier)...`);
            const instruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: walletAddress, role: 3 as const }, // WritableSigner
                    { address: gameStatePda, role: 1 as const }, // Writable
                    { address: vaultPda, role: 1 as const }, // Writable
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const }, // Readonly
                ],
                data: encodeBecomeKingData(selectedMultiplier.bps),
            };
            setTxStatus("Awaiting signature...");
            const signature = await send({ instructions: [instruction] });
            setTxStatus(`Crowned! Tx: ${signature?.slice(0, 20)}...`);
            setTimeout(fetchGameState, 2000);
        } catch (err) {
            console.error("Become king failed:", err);
            setTxStatus(
                `Error: ${err instanceof Error ? err.message : "Unknown error"}`
            );
        }
    }, [walletAddress, gameStatePda, vaultPda, send, fetchGameState, selectedMultiplier]);

    // Claim prize
    const handleClaimPrize = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda) return;
        try {
            setTxStatus("Building claim transaction...");
            const instruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: walletAddress, role: 3 as const }, // WritableSigner
                    { address: gameStatePda, role: 1 as const }, // Writable
                    { address: vaultPda, role: 1 as const }, // Writable
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const }, // Readonly
                ],
                data: getClaimPrizeInstructionDataEncoder().encode({}),
            };
            setTxStatus("Awaiting signature...");
            const signature = await send({ instructions: [instruction] });
            setTxStatus(`Prize claimed! 🎉 Tx: ${signature?.slice(0, 20)}...`);
            setTimeout(fetchGameState, 2000);
        } catch (err) {
            console.error("Claim prize failed:", err);
            setTxStatus(
                `Error: ${err instanceof Error ? err.message : "Unknown error"}`
            );
        }
    }, [walletAddress, gameStatePda, vaultPda, send, fetchGameState]);

    // Compute next price based on selected multiplier
    const nextPrice = gameState
        ? (gameState.currentPrice * BigInt(selectedMultiplier.bps)) / 10000n
        : 0n;

    if (loading) {
        return (
            <section className="w-full max-w-2xl mx-auto space-y-6 rounded-2xl border border-border-low bg-card p-8 shadow-[0_20px_80px_-40px_rgba(255,215,0,0.1)]">
                <div className="flex items-center justify-center gap-3 py-12">
                    <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-muted">Loading game state...</span>
                </div>
            </section>
        );
    }

    // Game not initialized yet
    if (!gameExists || !gameState) {
        return (
            <section className="w-full max-w-2xl mx-auto space-y-6 rounded-2xl border border-border-low bg-card p-8 shadow-[0_20px_80px_-40px_rgba(255,215,0,0.1)]">
                <div className="text-center space-y-4 py-8">
                    <div className="text-6xl animate-crown-pulse">👑</div>
                    <h2 className="text-2xl font-bold text-gold-gradient">
                        No Game Active
                    </h2>
                    <p className="text-muted max-w-md mx-auto">
                        Be the first to initialize a new round of Higher! Set up the game
                        and become the founding King.
                    </p>
                    {status === "connected" ? (
                        <button
                            onClick={handleInitialize}
                            disabled={isSending}
                            className="btn-gold rounded-xl px-8 py-3 text-lg"
                        >
                            {isSending ? "Initializing..." : "🏰 Initialize Game"}
                        </button>
                    ) : (
                        <p className="text-sm text-muted">
                            Connect your wallet to initialize the game
                        </p>
                    )}
                    {txStatus && (
                        <div className="rounded-lg border border-border-low bg-cream/50 px-4 py-3 text-sm mx-auto max-w-md">
                            {txStatus}
                        </div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="w-full max-w-2xl mx-auto space-y-5">
            {/* Crown & King Display */}
            <div className="rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-40px_rgba(255,215,0,0.1)] animate-glow-pulse">
                <div className="flex flex-col items-center gap-3">
                    <div className="text-7xl animate-crown-pulse">👑</div>
                    <div className="text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">
                            Current King
                        </p>
                        {hasKing ? (
                            <p className="text-lg font-bold font-mono text-gold-gradient">
                                {formatAddress(gameState.currentKing)}
                            </p>
                        ) : (
                            <p className="text-lg font-semibold text-muted italic">
                                No King Yet — Be the first!
                            </p>
                        )}
                        {isKing && (
                            <span className="inline-block mt-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                                ✨ That&apos;s you!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
                {/* Pot Size */}
                <div className="rounded-xl border border-border-low bg-card p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
                        Prize Pot
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-gold-gradient">
                        {formatSol(gameState.potAmount)}
                    </p>
                    <p className="text-xs text-muted">SOL</p>
                </div>

                {/* Countdown */}
                <div className="rounded-xl border border-border-low bg-card p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
                        Time Left
                    </p>
                    {!timerStarted ? (
                        <>
                            <p className="text-2xl font-bold tabular-nums font-mono text-muted">
                                --:--
                            </p>
                            <p className="text-[10px] text-muted mt-0.5">
                                Waiting for first King
                            </p>
                        </>
                    ) : (
                        <>
                            <p
                                className={`text-2xl font-bold tabular-nums font-mono ${isExpired
                                    ? "text-red-400"
                                    : countdown < 60
                                        ? "text-orange-400 animate-countdown-pulse"
                                        : "text-foreground"
                                    }`}
                            >
                                {formatCountdown(countdown)}
                            </p>
                            {countdown > 0 && countdown < 60 && (
                                <p className="text-[10px] text-orange-400 mt-0.5">⚡ Anti-Snipe Zone</p>
                            )}
                        </>
                    )}
                </div>

                {/* Current Price */}
                <div className="rounded-xl border border-border-low bg-card p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
                        Current Price
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-gold-gradient">
                        {formatSol(gameState.currentPrice)}
                    </p>
                    <p className="text-xs text-muted">SOL</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-2xl border border-border-low bg-card p-6 space-y-4">
                {status !== "connected" ? (
                    <div className="text-center py-4">
                        <p className="text-muted text-sm">
                            Connect your wallet to play
                        </p>
                    </div>
                ) : isExpired && isKing ? (
                    <button
                        onClick={handleClaimPrize}
                        disabled={isSending}
                        className="btn-gold w-full rounded-xl px-6 py-4 text-lg tracking-wide"
                    >
                        {isSending ? "Claiming..." : `🏆 Claim Prize (${formatSol(gameState.potAmount)} SOL)`}
                    </button>
                ) : isExpired ? (
                    <div className="text-center py-4 space-y-2">
                        <p className="text-lg font-semibold text-red-400">⏰ Game Over!</p>
                        <p className="text-sm text-muted">
                            The King can now claim the prize pot
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Multiplier Selection */}
                        <div>
                            <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3 font-semibold">
                                Choose your multiplier
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {MULTIPLIER_OPTIONS.map((option) => (
                                    <button
                                        key={option.bps}
                                        onClick={() => setSelectedMultiplier(option)}
                                        className={`relative rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer
                                            ${selectedMultiplier.bps === option.bps
                                                ? "bg-primary/20 text-primary border-2 border-primary shadow-[0_0_20px_-5px_rgba(255,215,0,0.3)] scale-105"
                                                : "bg-card border border-border-low text-muted hover:border-primary/30 hover:text-foreground hover:-translate-y-0.5"
                                            }`}
                                    >
                                        {option.label}
                                        {selectedMultiplier.bps === option.bps && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Preview */}
                        <div className="rounded-lg border border-border-low bg-cream/30 px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.15em] text-muted">You pay</p>
                                <p className="text-lg font-bold text-gold-gradient">
                                    {formatSol(gameState.currentPrice)} SOL
                                </p>
                            </div>
                            <div className="text-2xl text-muted">→</div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Next price becomes</p>
                                <p className="text-lg font-bold text-gold-gradient">
                                    {formatSol(nextPrice)} SOL
                                </p>
                            </div>
                        </div>

                        {/* Go Higher Button */}
                        <button
                            onClick={handleBecomeKing}
                            disabled={isSending}
                            className="btn-gold w-full rounded-xl px-6 py-4 text-lg tracking-wide"
                        >
                            {isSending
                                ? "Confirming..."
                                : hasKing
                                    ? `🚀 Go Higher — ${formatSol(gameState.currentPrice)} SOL`
                                    : `👑 Become First King — ${formatSol(gameState.currentPrice)} SOL`}
                        </button>
                    </>
                )}

                {/* Transaction Status */}
                {txStatus && (
                    <div className="rounded-lg border border-border-low bg-cream/50 px-4 py-3 text-sm break-all">
                        {txStatus}
                    </div>
                )}
            </div>

            {/* Game Info Footer */}
            <div className="rounded-xl border border-border-low bg-card/50 px-5 py-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.15em] text-muted font-semibold">
                    How it works
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
                    <div className="flex gap-2 items-start">
                        <span className="text-primary">▸</span>
                        <span>Pay SOL to become the King</span>
                    </div>
                    <div className="flex gap-2 items-start">
                        <span className="text-primary">▸</span>
                        <span>Choose your multiplier (1.25x – 3x)</span>
                    </div>
                    <div className="flex gap-2 items-start">
                        <span className="text-primary">▸</span>
                        <span>Timer starts when first King is crowned (2 min)</span>
                    </div>
                    <div className="flex gap-2 items-start">
                        <span className="text-primary">▸</span>
                        <span>Last King standing claims the whole pot</span>
                    </div>
                </div>
                {gameStatePda && (
                    <p className="pt-2 truncate font-mono text-[10px] text-muted/60 border-t border-border-low">
                        Game PDA: {gameStatePda}
                    </p>
                )}
            </div>
        </section>
    );
}

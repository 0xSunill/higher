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
    getBecomeKingInstructionDataEncoder,
    getClaimPrizeInstructionDataEncoder,
    getInitializeGameInstructionDataEncoder,
} from "../generated/higher/instructions";
import { HIGHER_PROGRAM_ADDRESS } from "../generated/higher/programs";

const LAMPORTS_PER_SOL = 1_000_000_000n;
const SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111" as Address;
const DEFAULT_PUBKEY = "11111111111111111111111111111111";

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

    // Live countdown timer
    useEffect(() => {
        if (!gameState) return;

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
    }, [gameState]);

    const isKing =
        walletAddress && gameState
            ? walletAddress === gameState.currentKing
            : false;
    const hasKing =
        gameState?.currentKing && gameState.currentKing !== DEFAULT_PUBKEY;
    const isExpired = countdown === 0 && gameState !== null;

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

    // Become king
    const handleBecomeKing = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda) return;
        try {
            setTxStatus("Building transaction...");
            const instruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: walletAddress, role: 3 as const }, // WritableSigner
                    { address: gameStatePda, role: 1 as const }, // Writable
                    { address: vaultPda, role: 1 as const }, // Writable
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const }, // Readonly
                ],
                data: getBecomeKingInstructionDataEncoder().encode({}),
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
    }, [walletAddress, gameStatePda, vaultPda, send, fetchGameState]);

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
                    <p
                        className={`text-2xl font-bold tabular-nums font-mono ${isExpired
                            ? "text-red-400"
                            : countdown < 600
                                ? "text-orange-400 animate-countdown-pulse"
                                : "text-foreground"
                            }`}
                    >
                        {formatCountdown(countdown)}
                    </p>
                    {countdown > 0 && countdown < 600 && (
                        <p className="text-[10px] text-orange-400 mt-0.5">⚡ Anti-Snipe Zone</p>
                    )}
                </div>

                {/* Next Price */}
                <div className="rounded-xl border border-border-low bg-card p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">
                        Next Price
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
                    <button
                        onClick={handleBecomeKing}
                        disabled={isSending}
                        className="btn-gold w-full rounded-xl px-6 py-4 text-lg tracking-wide"
                    >
                        {isSending
                            ? "Confirming..."
                            : `🚀 Go Higher — ${formatSol(gameState.currentPrice)} SOL`}
                    </button>
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
                        <span>Price increases 20% each time</span>
                    </div>
                    <div className="flex gap-2 items-start">
                        <span className="text-primary">▸</span>
                        <span>Timer resets to 1hr (or 10min if &lt;10min left)</span>
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

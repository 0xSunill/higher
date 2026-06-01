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
import { GameHeader } from "./game/game-header";
import { GameControls } from "./game/game-controls";
import { PreviousWinners } from "./game/previous-winners";
import { HowItWorks } from "./game/how-it-works";
import { extractSolanaErrorMessage } from "./game/tx-error";

const HIGHER_PROGRAM_ADDRESS = "hiHQCBK7yUu6KNp5sN9yNrrKFcirokX1act8B1HnTH7" as Address;
const SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111" as Address;
const DEFAULT_PUBKEY = "11111111111111111111111111111111";

// 5 minutes local cache timer vs exact cluster time
const rpc = createSolanaRpc("https://api.devnet.solana.com");

const MULTIPLIER_OPTIONS = [
    { label: "1.25x", bps: 12500, multiplier: 1.25 },
    { label: "1.5x", bps: 15000, multiplier: 1.5 },
    { label: "1.75x", bps: 17500, multiplier: 1.75 },
    { label: "2.0x", bps: 20000, multiplier: 2.0 },
    { label: "2.5x", bps: 25000, multiplier: 2.5 },
    { label: "3.0x", bps: 30000, multiplier: 3.0 },
];

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
    const selectedMultiplierRef = useRef(selectedMultiplier);
    selectedMultiplierRef.current = selectedMultiplier;
    const [showWinnerDetails, setShowWinnerDetails] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const walletAddress = wallet?.account.address;

    useEffect(() => {
        async function derivePDAs() {
            const [gs] = await getProgramDerivedAddress({
                programAddress: HIGHER_PROGRAM_ADDRESS,
                seeds: [getBytesEncoder().encode(new Uint8Array([103, 97, 109, 101, 95, 115, 116, 97, 116, 101, 95, 118, 50]))],
            });
            const [v] = await getProgramDerivedAddress({
                programAddress: HIGHER_PROGRAM_ADDRESS,
                seeds: [getBytesEncoder().encode(new Uint8Array([118, 97, 117, 108, 116, 95, 118, 50]))],
            });
            setGameStatePda(gs);
            setVaultPda(v);
        }
        derivePDAs();
    }, []);

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

    useEffect(() => {
        fetchGameState();
        const interval = setInterval(fetchGameState, 5000);
        return () => clearInterval(interval);
    }, [fetchGameState]);

    const hasKing = gameState?.currentKing && gameState.currentKing !== DEFAULT_PUBKEY;
    const timerStarted = gameState ? Number(gameState.endTime) > 0 : false;
    const hasLastWinner = gameState?.recentWinners?.[0]?.address && gameState.recentWinners[0].address !== DEFAULT_PUBKEY;

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
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [gameState, timerStarted]);

    const isKing = walletAddress && gameState ? walletAddress === gameState.currentKing : false;
    const isExpired = timerStarted && countdown === 0 && gameState !== null;

    const handleInitialize = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda) return;
        try {
            setTxStatus("Building initialize transaction...");
            const instruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: walletAddress, role: 3 as const },
                    { address: gameStatePda, role: 1 as const },
                    { address: vaultPda, role: 1 as const },
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const },
                ],
                data: getInitializeGameInstructionDataEncoder().encode({}),
            };
            setTxStatus("Awaiting signature...");
            const signature = await send({ instructions: [instruction] });
            setTxStatus(`Game Initialized! Tx: ${signature?.slice(0, 20)}...`);
            setTimeout(fetchGameState, 2000);
        } catch (err) {
            console.error("Initialize failed:", err);
            setTxStatus(`Error: ${extractSolanaErrorMessage(err)}`);
        }
    }, [walletAddress, gameStatePda, vaultPda, send, fetchGameState]);

    const handleBecomeKing = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda) return;
        try {
            setTxStatus("Building transaction...");
            const instruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: walletAddress, role: 3 as const },
                    { address: gameStatePda, role: 1 as const },
                    { address: vaultPda, role: 1 as const },
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const },
                ],
                data: getBecomeKingInstructionDataEncoder().encode({ multiplierBps: selectedMultiplierRef.current.bps }),
            };
            setTxStatus("Awaiting signature...");
            const signature = await send({ instructions: [instruction] });
            setTxStatus(`Crowned! Tx: ${signature?.slice(0, 20)}...`);
            setTimeout(fetchGameState, 2000);
        } catch (err) {
            console.error("Become king failed:", err);
            setTxStatus(`Error: ${extractSolanaErrorMessage(err)}`);
        }
    }, [walletAddress, gameStatePda, vaultPda, send, fetchGameState]);

    const handleClaimPrize = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda || !gameState) return;
        try {
            setTxStatus("Building claim transaction...");
            const instruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: gameState.currentKing, role: 1 as const }, // king: writable
                    { address: walletAddress, role: 3 as const },         // payer: writable signer
                    { address: gameStatePda, role: 1 as const },
                    { address: vaultPda, role: 1 as const },
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const },
                ],
                data: getClaimPrizeInstructionDataEncoder().encode({}),
            };
            setTxStatus("Awaiting signature...");
            const signature = await send({ instructions: [instruction] });
            setTxStatus(`Prize claimed! 🎉 Tx: ${signature?.slice(0, 20)}...`);
            setTimeout(fetchGameState, 2000);
        } catch (err) {
            console.error("Claim prize failed:", err);
            setTxStatus(`Error: ${extractSolanaErrorMessage(err)}`);
        }
    }, [walletAddress, gameStatePda, vaultPda, gameState, send, fetchGameState]);

    const handleStartNewRound = useCallback(async () => {
        if (!walletAddress || !gameStatePda || !vaultPda || !gameState) return;
        try {
            setTxStatus("Building bundled transaction...");
            const claimInstruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: gameState.currentKing, role: 1 as const }, // king receives lamports
                    { address: walletAddress, role: 3 as const },         // caller pays tx fee
                    { address: gameStatePda, role: 1 as const },
                    { address: vaultPda, role: 1 as const },
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const },
                ],
                data: getClaimPrizeInstructionDataEncoder().encode({}),
            };

            const becomeKingInstruction = {
                programAddress: HIGHER_PROGRAM_ADDRESS,
                accounts: [
                    { address: walletAddress, role: 3 as const },
                    { address: gameStatePda, role: 1 as const },
                    { address: vaultPda, role: 1 as const },
                    { address: SYSTEM_PROGRAM_ADDRESS, role: 0 as const },
                ],
                data: getBecomeKingInstructionDataEncoder().encode({ multiplierBps: selectedMultiplierRef.current.bps }),
            };

            setTxStatus("Awaiting signature...");
            // Bundle the two instructions into a single transaction!
            const signature = await send({ instructions: [claimInstruction, becomeKingInstruction] });
            setTxStatus(`New round started! Tx: ${signature?.slice(0, 20)}...`);
            setTimeout(fetchGameState, 2000);
        } catch (err) {
            console.error("Start new round failed:", err);
            setTxStatus(`Error: ${extractSolanaErrorMessage(err)}`);
        }
    }, [walletAddress, gameStatePda, vaultPda, gameState, send, fetchGameState]);

    // With the new logic: the multiplier affects YOUR payment
    // First king pays the base currentPrice (0.01 SOL)
    // Subsequent kings pay currentPrice * multiplier
    const basePrice = gameState
        ? (isExpired ? 10000000n : gameState.currentPrice)
        : 0n;
    const yourPrice = gameState
        ? (hasKing && !isExpired
            ? basePrice * BigInt(selectedMultiplier.bps) / 10000n
            : basePrice)
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

    if (!gameExists || !gameState) {
        return (
            <section className="w-full max-w-2xl mx-auto space-y-6 rounded-2xl border border-border-low bg-card p-8 shadow-[0_20px_80px_-40px_rgba(255,215,0,0.1)]">
                <div className="text-center space-y-4 py-8">
                    <div className="text-6xl animate-crown-pulse">👑</div>
                    <h2 className="text-2xl font-bold text-gold-gradient">No Game Active</h2>
                    <p className="text-muted max-w-md mx-auto">
                        Be the first to initialize a new round of Higher! Set up the game and become the founding King.
                    </p>
                    {status === "connected" ? (
                        <button onClick={handleInitialize} disabled={isSending} className="btn-gold rounded-xl px-8 py-3 text-lg">
                            {isSending ? "Initializing..." : "🏰 Initialize Game"}
                        </button>
                    ) : (
                        <p className="text-sm text-muted">Connect your wallet to initialize the game</p>
                    )}
                    {txStatus && (
                        <div className="rounded-lg border border-border-low bg-cream/50 px-4 py-3 text-sm mx-auto max-w-md">{txStatus}</div>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="w-full max-w-2xl mx-auto space-y-5">
            <GameHeader 
                gameState={gameState} 
                hasKing={hasKing ?? false} 
                isKing={isKing ?? false} 
                timerStarted={timerStarted} 
                countdown={countdown} 
                isExpired={isExpired} 
            />

            <GameControls
                status={status}
                isExpired={isExpired}
                isKing={isKing ?? false}
                hasKing={hasKing ?? false}
                isSending={isSending}
                txStatus={txStatus}
                gameState={gameState}
                yourPrice={yourPrice}
                selectedMultiplier={selectedMultiplier}
                MULTIPLIER_OPTIONS={MULTIPLIER_OPTIONS}
                setSelectedMultiplier={setSelectedMultiplier}
                handleClaimPrize={handleClaimPrize}
                handleStartNewRound={handleStartNewRound}
                handleBecomeKing={handleBecomeKing}
            />

            <PreviousWinners
                gameState={gameState}
                hasLastWinner={hasLastWinner ?? false}
                showWinnerDetails={showWinnerDetails}
                setShowWinnerDetails={setShowWinnerDetails}
            />

            <HowItWorks 
                gameState={gameState} 
                gameStatePda={gameStatePda} 
            />
        </section>
    );
}

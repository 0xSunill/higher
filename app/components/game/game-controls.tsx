import { GameState } from "../../generated/higher/accounts";
import { formatSol } from "./utils";
import { Trophy, Timer, RotateCcw, Rocket, Crown, Wallet } from "lucide-react";

type MultiplierOption = { label: string; bps: number; multiplier: number };

type GameControlsProps = {
    status: string;
    connectors: readonly any[];
    connect: (id: string) => void;
    isExpired: boolean;
    isKing: boolean;
    hasKing: boolean;
    isSending: boolean;
    txStatus: string | null;
    gameState: GameState;
    yourPrice: bigint;
    selectedMultiplier: MultiplierOption;
    MULTIPLIER_OPTIONS: MultiplierOption[];
    setSelectedMultiplier: (opt: MultiplierOption) => void;
    handleClaimPrize: () => void;
    handleStartNewRound: () => void;
    handleBecomeKing: () => void;
};

export function GameControls({
    status,
    connectors,
    connect,
    isExpired,
    isKing,
    hasKing,
    isSending,
    txStatus,
    gameState,
    yourPrice,
    selectedMultiplier,
    MULTIPLIER_OPTIONS,
    setSelectedMultiplier,
    handleClaimPrize,
    handleStartNewRound,
    handleBecomeKing,
}: GameControlsProps) {
    
    const handleConnectClick = () => {
        if (connectors.length > 0) connect(connectors[0].id);
    };

    return (
        <div className="glass-card rounded-2xl p-6 space-y-5 animate-fadeInUp stagger-3 h-full flex flex-col justify-center">
            {isExpired && isKing ? (
                /* Winner can claim */
                <div className="space-y-4">
                    <div className="text-center space-y-3 py-2 flex flex-col items-center">
                        <div className="text-primary bg-primary/10 p-4 rounded-full border border-primary/20 animate-crown-float drop-shadow-[0_0_20px_rgba(167,139,250,0.3)]">
                            <Trophy size={40} strokeWidth={1.5} />
                        </div>
                        <p className="text-2xl font-bold text-foreground drop-shadow-sm">You Won!</p>
                        <p className="text-sm text-muted">Claim your prize from the pot</p>
                    </div>
                    {status !== "connected" ? (
                        <button onClick={handleConnectClick} className="btn-aurora w-full rounded-xl px-6 py-4 text-lg tracking-wide flex items-center justify-center gap-2">
                            <Wallet size={20} /> Connect Wallet
                        </button>
                    ) : (
                        <button
                            onClick={handleClaimPrize}
                            disabled={isSending}
                            className="btn-aurora w-full rounded-xl px-6 py-4 text-lg tracking-wide flex items-center justify-center gap-2"
                        >
                            <Trophy size={20} />
                            {isSending ? "Claiming..." : `Claim Prize — ${formatSol(gameState.potAmount)} SOL`}
                        </button>
                    )}
                </div>
            ) : isExpired ? (
                /* Game over — start new round */
                <div className="space-y-5">
                    <div className="text-center space-y-3 py-1 flex flex-col items-center">
                        <div className="text-red-400 bg-red-400/10 p-3 rounded-full border border-red-400/20">
                            <Timer size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-xl font-bold text-red-400 drop-shadow-sm">Game Over!</p>
                        <p className="text-sm text-muted max-w-sm mx-auto">
                            {hasKing
                                ? "The King didn’t claim in time. Start a new round — the pot carries over!"
                                : "No one played this round. Start a new one!"}
                        </p>
                    </div>

                    <div className="divider-aurora" />

                    {/* Multiplier selector */}
                    <div>
                        <p className="section-label mb-3">
                            Choose multiplier & start new round
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {MULTIPLIER_OPTIONS.map((option) => (
                                <button
                                    key={option.bps}
                                    onClick={() => setSelectedMultiplier(option)}
                                    className={`multiplier-chip ${selectedMultiplier.bps === option.bps ? 'active' : ''}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {status !== "connected" ? (
                        <button onClick={handleConnectClick} className="btn-aurora w-full rounded-xl px-6 py-4 text-lg tracking-wide flex items-center justify-center gap-2">
                            <Wallet size={20} /> Connect Wallet
                        </button>
                    ) : (
                        <button
                            onClick={handleStartNewRound}
                            disabled={isSending}
                            className="btn-aurora w-full rounded-xl px-6 py-4 text-lg tracking-wide flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={20} />
                            {isSending ? "Starting..." : "Start New Round — 0.0100 SOL"}
                        </button>
                    )}
                </div>
            ) : (
                /* Active game — become king */
                <div className="space-y-5">
                    {/* Multiplier selector */}
                    <div>
                        <p className="section-label mb-3">Choose your multiplier</p>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {MULTIPLIER_OPTIONS.map((option) => (
                                <button
                                    key={option.bps}
                                    onClick={() => setSelectedMultiplier(option)}
                                    className={`multiplier-chip ${selectedMultiplier.bps === option.bps ? 'active' : ''}`}
                                >
                                    {option.label}
                                    {selectedMultiplier.bps === option.bps && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" style={{ animation: 'ping-soft 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-[0_0_6px_rgba(124,219,255,0.4)]" />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-border-low" />

                    {/* Price Preview */}
                    <div className="rounded-xl p-4 flex items-center justify-between gap-2" style={{ background: 'var(--surface-1)' }}>
                        <div>
                            <p className="section-label">Base price</p>
                            <p className="text-lg font-bold text-muted mt-1">
                                {formatSol(gameState.currentPrice)} <span className="text-xs font-medium">SOL</span>
                            </p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'var(--surface-2)' }}>
                            <span className="text-lg text-muted font-bold">×</span>
                        </div>
                        <div className="text-center">
                            <p className="section-label">Multi</p>
                            <p className="text-lg font-bold text-foreground mt-1">{selectedMultiplier.label}</p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'var(--surface-2)' }}>
                            <span className="text-lg text-muted font-bold">=</span>
                        </div>
                        <div className="text-right">
                            <p className="section-label">You pay</p>
                            <p className="text-lg font-bold text-aurora-gradient mt-1 drop-shadow-sm">
                                {formatSol(yourPrice)} <span className="text-xs font-medium" style={{ WebkitTextFillColor: 'var(--muted)' }}>SOL</span>
                            </p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    {status !== "connected" ? (
                        <button onClick={handleConnectClick} className="btn-aurora w-full rounded-xl px-6 py-4 text-lg tracking-wide flex items-center justify-center gap-2">
                            <Wallet size={20} /> Connect Wallet
                        </button>
                    ) : (
                        <button
                            onClick={handleBecomeKing}
                            disabled={isSending}
                            className="btn-aurora w-full rounded-xl px-6 py-4 text-lg tracking-wide flex items-center justify-center gap-2"
                        >
                            {isSending ? (
                                "Confirming..."
                            ) : hasKing ? (
                                <>
                                    <Rocket size={20} /> Go Higher — {formatSol(yourPrice)} SOL
                                </>
                            ) : (
                                <>
                                    <Crown size={20} /> Become First King — {formatSol(yourPrice)} SOL
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Transaction Status */}
            {txStatus && (
                <div className="tx-status break-all">{txStatus}</div>
            )}
        </div>
    );
}

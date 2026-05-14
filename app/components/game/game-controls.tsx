import { GameState } from "../../generated/higher/accounts";
import { formatSol } from "./utils";

type MultiplierOption = { label: string; bps: number; multiplier: number };

type GameControlsProps = {
    status: string;
    isExpired: boolean;
    isKing: boolean;
    hasKing: boolean;
    isSending: boolean;
    txStatus: string | null;
    gameState: GameState;
    nextPrice: bigint;
    selectedMultiplier: MultiplierOption;
    MULTIPLIER_OPTIONS: MultiplierOption[];
    setSelectedMultiplier: (opt: MultiplierOption) => void;
    handleClaimPrize: () => void;
    handleStartNewRound: () => void;
    handleBecomeKing: () => void;
};

export function GameControls({
    status,
    isExpired,
    isKing,
    hasKing,
    isSending,
    txStatus,
    gameState,
    nextPrice,
    selectedMultiplier,
    MULTIPLIER_OPTIONS,
    setSelectedMultiplier,
    handleClaimPrize,
    handleStartNewRound,
    handleBecomeKing,
}: GameControlsProps) {
    return (
        <div className="rounded-2xl border border-border-low bg-card p-6 space-y-4">
            {status !== "connected" ? (
                <div className="text-center py-4">
                    <p className="text-muted text-sm">Connect your wallet to play</p>
                </div>
            ) : isExpired && isKing ? (
                <button onClick={handleClaimPrize} disabled={isSending} className="btn-gold w-full rounded-xl px-6 py-4 text-lg tracking-wide">
                    {isSending ? "Claiming..." : `🏆 Claim Prize (${formatSol(gameState.potAmount)} SOL)`}
                </button>
            ) : isExpired ? (
                <div className="space-y-4">
                    <div className="text-center space-y-2">
                        <p className="text-lg font-semibold text-red-400">⏰ Game Over!</p>
                        <p className="text-sm text-muted">
                            {hasKing
                                ? "The King didn\u2019t claim. Start a new round — the pot carries over!" // We will fix this text in game-card refactor
                                : "No one played this round. Start a new one!"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3 font-semibold">
                            Choose your multiplier & start new round
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
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleStartNewRound}
                        disabled={isSending}
                        className="btn-gold w-full rounded-xl px-6 py-4 text-lg tracking-wide"
                    >
                        {isSending ? "Starting..." : `🔄 Start New Round — 0.0100 SOL`}
                    </button>
                </div>
            ) : (
                <>
                    <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-muted mb-3 font-semibold">Choose your multiplier</p>
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
                            <p className="text-lg font-bold text-gold-gradient">{formatSol(gameState.currentPrice)} SOL</p>
                        </div>
                        <div className="text-2xl text-muted">→</div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">Next price becomes</p>
                            <p className="text-lg font-bold text-gold-gradient">{formatSol(nextPrice)} SOL</p>
                        </div>
                    </div>

                    <button onClick={handleBecomeKing} disabled={isSending} className="btn-gold w-full rounded-xl px-6 py-4 text-lg tracking-wide">
                        {isSending
                            ? "Confirming..."
                            : hasKing
                                ? `🚀 Go Higher — ${formatSol(gameState.currentPrice)} SOL`
                                : `👑 Become First King — ${formatSol(gameState.currentPrice)} SOL`}
                    </button>
                </>
            )}

            {txStatus && (
                <div className="rounded-lg border border-border-low bg-cream/50 px-4 py-3 text-sm break-all">{txStatus}</div>
            )}
        </div>
    );
}

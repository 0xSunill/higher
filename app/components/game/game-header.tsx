import { Address } from "@solana/kit";
import { GameState } from "../../generated/higher/accounts";
import { formatAddress, formatSol, formatCountdown } from "./utils";

type GameHeaderProps = {
    gameState: GameState;
    hasKing: boolean;
    isKing: boolean;
    timerStarted: boolean;
    countdown: number;
    isExpired: boolean;
};

export function GameHeader({ gameState, hasKing, isKing, timerStarted, countdown, isExpired }: GameHeaderProps) {
    return (
        <>
            <div className="rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-40px_rgba(255,215,0,0.1)] animate-glow-pulse">
                <div className="flex flex-col items-center gap-3">
                    <div className="text-7xl animate-crown-pulse">👑</div>
                    <div className="text-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">Current King</p>
                        {hasKing ? (
                            <p className="text-lg font-bold font-mono text-gold-gradient">{formatAddress(gameState.currentKing)}</p>
                        ) : (
                            <p className="text-lg font-semibold text-muted italic">No King Yet — Be the first!</p>
                        )}
                        {isKing && (
                            <span className="inline-block mt-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                                ✨ That&apos;s you!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border-low bg-card p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">Prize Pot</p>
                    <p className="text-2xl font-bold tabular-nums text-gold-gradient">{formatSol(gameState.potAmount)}</p>
                    <p className="text-xs text-muted">SOL</p>
                </div>

                <div className="rounded-xl border border-border-low bg-card p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">Time Left</p>
                    {!timerStarted ? (
                        <>
                            <p className="text-2xl font-bold tabular-nums font-mono text-muted">--:--</p>
                            <p className="text-[10px] text-muted mt-0.5">Waiting for first King</p>
                        </>
                    ) : (
                        <>
                            <p className={`text-2xl font-bold tabular-nums font-mono ${isExpired ? "text-red-400" : countdown < 60 ? "text-orange-400 animate-countdown-pulse" : "text-foreground"}`}>
                                {formatCountdown(countdown)}
                            </p>
                            {countdown > 0 && countdown < 60 && (
                                <p className="text-[10px] text-orange-400 mt-0.5">⚡ Anti-Snipe Zone</p>
                            )}
                        </>
                    )}
                </div>

                <div className="rounded-xl border border-border-low bg-card p-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-1">Current Price</p>
                    <p className="text-2xl font-bold tabular-nums text-gold-gradient">
                        {formatSol(isExpired ? 10000000n : gameState.currentPrice)}
                    </p>
                    <p className="text-xs text-muted">SOL</p>
                </div>
            </div>
        </>
    );
}

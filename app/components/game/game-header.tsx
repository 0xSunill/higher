import { GameState } from "../../generated/higher/accounts";
import { formatAddress, formatSol, formatCountdown } from "./utils";
import { Crown, Sparkles } from "lucide-react";

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
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fadeInUp stagger-1 relative overflow-hidden h-full">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,219,255,0.08),transparent_50%)]" />
            {/* Crown / King Open Layout */}
            <div className="flex flex-col items-center gap-5">
                <div className="relative">
                    <div className="animate-crown-float drop-shadow-[0_0_30px_rgba(45,212,191,0.4)] text-[#2dd4bf] bg-[#2dd4bf24] p-5 rounded-full border border-[#2dd4bf40]">
                        <Crown size={56} strokeWidth={1.5} />
                    </div>
                    {isKing && (
                        <div className="absolute -bottom-2 -right-2 text-primary animate-fadeIn bg-card p-1.5 rounded-full border border-primary/30">
                            <Sparkles size={16} />
                        </div>
                    )}
                </div>
                <div className="text-center space-y-2">
                    <p className="section-label">Current King</p>
                    {hasKing ? (
                        <p className="text-2xl font-bold font-mono text-foreground tracking-wide drop-shadow-sm">
                            {formatAddress(gameState.currentKing)}
                        </p>
                    ) : (
                        <p className="text-lg font-semibold text-muted italic">
                            Throne is empty — Be the first!
                        </p>
                    )}
                    {isKing && (
                        <span className="inline-flex items-center gap-1.5 mt-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                            style={{
                                background: 'var(--accent-dim)',
                                color: 'var(--primary)',
                                border: '1px solid rgba(124, 219, 255, 0.15)'
                            }}
                        >
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                            That&apos;s you!
                        </span>
                    )}
                </div>
            </div>

            {/* Stats Open Row */}
            <div className="grid grid-cols-3 gap-2">
                {/* Prize Pot */}
                <div className="text-center p-3">
                    <p className="section-label mb-2">Prize Pot</p>
                    <p className="text-3xl font-extrabold tabular-nums text-aurora-gradient drop-shadow-sm">
                        {formatSol(gameState.potAmount)}
                    </p>
                    <p className="text-[10px] text-muted mt-1 font-medium uppercase tracking-wider">SOL</p>
                </div>

                {/* Timer */}
                <div className="text-center p-3 relative">
                    {/* Subtle divider lines */}
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-px bg-border-low" />
                    <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-border-low" />
                    
                    <p className="section-label mb-2">Time Left</p>
                    {!timerStarted ? (
                        <>
                            <p className="text-3xl font-extrabold tabular-nums font-mono text-muted/40">
                                --:--
                            </p>
                            <p className="text-[10px] text-muted mt-1">Waiting for King</p>
                        </>
                    ) : (
                        <>
                            <p className={`text-3xl font-extrabold tabular-nums font-mono drop-shadow-sm ${
                                isExpired
                                    ? "text-red-400"
                                    : countdown < 60
                                        ? "text-orange-400 animate-countdown-pulse"
                                        : "text-foreground"
                            }`}>
                                {formatCountdown(countdown)}
                            </p>
                            {countdown > 0 && countdown < 60 && (
                                <p className="text-[10px] text-orange-400 mt-1 font-semibold flex items-center justify-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-orange-400 animate-ping" />
                                    Anti-Snipe Zone
                                </p>
                            )}
                            {isExpired && (
                                <p className="text-[10px] text-red-400 mt-1 font-semibold">EXPIRED</p>
                            )}
                        </>
                    )}
                </div>

                {/* Current Price */}
                <div className="text-center p-3">
                    <p className="section-label mb-2">Base Price</p>
                    <p className="text-3xl font-extrabold tabular-nums text-foreground drop-shadow-sm">
                        {formatSol(isExpired ? 10000000n : gameState.currentPrice)}
                    </p>
                    <p className="text-[10px] text-muted mt-1 font-medium uppercase tracking-wider">SOL</p>
                </div>
            </div>
        </div>
    );
}

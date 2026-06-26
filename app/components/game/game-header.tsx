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
        <div className="space-y-4 animate-fadeInUp stagger-2">
            {/* Crown / King Card */}
            <div className="glass-card-glow rounded-2xl p-7 animate-border-shimmer">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <span className="text-7xl animate-crown-float inline-block drop-shadow-[0_0_40px_rgba(245,197,24,0.2)]">
                            👑
                        </span>
                        {isKing && (
                            <span className="absolute -bottom-1 -right-2 text-xl animate-fadeIn">✨</span>
                        )}
                    </div>
                    <div className="text-center space-y-2">
                        <p className="section-label">Current King</p>
                        {hasKing ? (
                            <p className="text-xl font-bold font-mono text-gold-gradient tracking-wide">
                                {formatAddress(gameState.currentKing)}
                            </p>
                        ) : (
                            <p className="text-lg font-semibold text-muted italic">
                                Throne is empty — Be the first!
                            </p>
                        )}
                        {isKing && (
                            <span className="inline-flex items-center gap-1.5 mt-1 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                                style={{
                                    background: 'var(--accent-dim)',
                                    color: 'var(--accent)',
                                    border: '1px solid rgba(245, 197, 24, 0.15)'
                                }}
                            >
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
                                That&apos;s you!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                {/* Prize Pot */}
                <div className="glass-card stat-card rounded-xl p-4 text-center">
                    <p className="section-label mb-2">Prize Pot</p>
                    <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-gold-gradient">
                        {formatSol(gameState.potAmount)}
                    </p>
                    <p className="text-[10px] text-muted mt-1 font-medium uppercase tracking-wider">SOL</p>
                </div>

                {/* Timer */}
                <div className={`glass-card stat-card rounded-xl p-4 text-center ${isExpired ? 'animate-border-shimmer' : ''}`}
                    style={isExpired ? { borderColor: 'rgba(248, 113, 113, 0.2)' } : {}}
                >
                    <p className="section-label mb-2">Time Left</p>
                    {!timerStarted ? (
                        <>
                            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums font-mono text-muted/40">
                                --:--
                            </p>
                            <p className="text-[10px] text-muted mt-1">Waiting for King</p>
                        </>
                    ) : (
                        <>
                            <p className={`text-2xl sm:text-3xl font-extrabold tabular-nums font-mono ${
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
                <div className="glass-card stat-card rounded-xl p-4 text-center">
                    <p className="section-label mb-2">Base Price</p>
                    <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-gold-gradient">
                        {formatSol(isExpired ? 10000000n : gameState.currentPrice)}
                    </p>
                    <p className="text-[10px] text-muted mt-1 font-medium uppercase tracking-wider">SOL</p>
                </div>
            </div>
        </div>
    );
}

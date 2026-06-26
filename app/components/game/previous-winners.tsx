import { GameState } from "../../generated/higher/accounts";
import { formatAddress, formatSol } from "./utils";


const DEFAULT_PUBKEY = "11111111111111111111111111111111";
const MAX_WINNERS_SHOWN = 3;

type PreviousWinnersProps = {
    gameState: GameState;
    hasLastWinner: boolean;
    showWinnerDetails: boolean;
    setShowWinnerDetails: (show: boolean) => void;
};

export function PreviousWinners({ gameState, hasLastWinner, showWinnerDetails, setShowWinnerDetails }: PreviousWinnersProps) {
    if (!gameState) return null;

    // Filter out empty/default slots and take only the last 3 valid winners
    const validWinners = gameState.recentWinners
        .filter(w => w.address !== DEFAULT_PUBKEY)
        .slice(0, MAX_WINNERS_SHOWN);

    if (validWinners.length === 0) return null;

    const latestWinner = validWinners[0];

    const medals = ["🥇", "🥈", "🥉"];

    return (
        <div className="glass-card rounded-2xl overflow-hidden animate-fadeInUp stagger-4">
            <button
                onClick={() => setShowWinnerDetails(!showWinnerDetails)}
                className="w-full px-5 py-4 flex items-center justify-between cursor-pointer transition-colors duration-300 hover:bg-[rgba(255,255,255,0.02)]"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div className="text-left">
                        <p className="section-label">
                            Previous Winners
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    background: 'var(--accent-dim)',
                                    color: 'var(--accent)',
                                }}
                            >
                                {validWinners.length}
                            </span>
                        </p>
                        <p className="text-sm font-bold font-mono text-gold-gradient mt-1">
                            {formatAddress(latestWinner.address)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gold-gradient">{formatSol(latestWinner.prize)} SOL</span>
                    <span className={`text-muted text-xs transition-transform duration-300 ${showWinnerDetails ? "rotate-180" : ""}`}>
                        ▾
                    </span>
                </div>
            </button>

            {showWinnerDetails && (
                <div className="border-t border-border-low animate-slideDown">
                    {validWinners.map((winner, idx) => (
                        <div key={idx} className="px-5 py-3.5 flex items-center justify-between transition-colors duration-300 hover:bg-[rgba(255,255,255,0.02)]"
                            style={{ borderBottom: idx < validWinners.length - 1 ? '1px solid var(--border-low)' : 'none' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{medals[idx] || "🏅"}</span>
                                <div>
                                    <span className="text-xs font-mono font-bold text-foreground">
                                        {formatAddress(winner.address)}
                                    </span>
                                    <span className="text-muted text-[10px] ml-2 font-medium">
                                        Round {winner.roundNumber}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gold-gradient">{formatSol(winner.prize)} SOL</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

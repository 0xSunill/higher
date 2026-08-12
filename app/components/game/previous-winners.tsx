import { GameState } from "../../generated/higher/accounts";
import { formatAddress, formatSol } from "./utils";
import { Trophy, Medal, ChevronDown } from "lucide-react";

const DEFAULT_PUBKEY = "11111111111111111111111111111111";
const MAX_WINNERS_SHOWN = 3;

type PreviousWinnersProps = {
    gameState: GameState;
    showWinnerDetails: boolean;
    setShowWinnerDetails: (show: boolean) => void;
};

export function PreviousWinners({ gameState, showWinnerDetails, setShowWinnerDetails }: PreviousWinnersProps) {
    if (!gameState) return null;

    // Filter out empty/default slots and take only the last 3 valid winners
    const validWinners = gameState.recentWinners
        .filter(w => w.address !== DEFAULT_PUBKEY)
        .slice(0, MAX_WINNERS_SHOWN);

    if (validWinners.length === 0) return null;

    const latestWinner = validWinners[0];

    return (
        <div className="glass-card rounded-2xl animate-fadeInUp stagger-4 mt-8">
            <button
                onClick={() => setShowWinnerDetails(!showWinnerDetails)}
                className="w-full px-5 py-4 flex items-center justify-between cursor-pointer group"
            >
                <div className="flex items-center gap-3">
                    <div className="icon-badge-neon w-8 h-8 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Trophy size={16} strokeWidth={2} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs uppercase tracking-widest text-muted font-bold flex items-center gap-2">
                            Previous Winners
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-primary/20 text-primary">
                                {validWinners.length}
                            </span>
                        </p>
                        <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                            {formatAddress(latestWinner.address)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{formatSol(latestWinner.prize)} SOL</span>
                    <ChevronDown 
                        size={16} 
                        className={`text-muted transition-transform duration-300 ${showWinnerDetails ? "rotate-180" : ""}`} 
                    />
                </div>
            </button>

            {showWinnerDetails && (
                <div className="animate-slideDown pl-12 pr-2">
                    {validWinners.map((winner, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between"
                            style={{ borderBottom: idx < validWinners.length - 1 ? '1px dashed var(--border-low)' : 'none' }}
                        >
                            <div className="flex items-center gap-3">
                                <Medal size={14} className={idx === 0 ? "text-primary" : "text-muted"} />
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
                                <p className="text-sm font-bold text-foreground">{formatSol(winner.prize)} SOL</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import { GameState } from "../../generated/higher/accounts";
import { formatAddress, formatSol } from "./utils";


const DEFAULT_PUBKEY = "11111111111111111111111111111111";

type PreviousWinnersProps = {
    gameState: GameState;
    hasLastWinner: boolean;
    showWinnerDetails: boolean;
    setShowWinnerDetails: (show: boolean) => void;
};

export function PreviousWinners({ gameState, hasLastWinner, showWinnerDetails, setShowWinnerDetails }: PreviousWinnersProps) {
    if (!hasLastWinner || !gameState) return null;

    return (
        <div className="rounded-2xl border border-border-low bg-card overflow-hidden">
            <button
                onClick={() => setShowWinnerDetails(!showWinnerDetails)}
                className="w-full px-5 py-4 flex items-center justify-between cursor-pointer transition hover:bg-cream/5"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div className="text-left">
                        <p className="text-xs uppercase tracking-[0.15em] text-muted font-semibold">Previous Winners</p>
                        <p className="text-sm font-bold font-mono text-gold-gradient">
                            {formatAddress(gameState.recentWinners[0].address)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gold-gradient">{formatSol(gameState.recentWinners[0].prize)} SOL</span>
                    <span className={`text-muted transition-transform duration-200 ${showWinnerDetails ? "rotate-180" : ""}`}>
                        ▼
                    </span>
                </div>
            </button>

            {showWinnerDetails && (
                <div className="border-t border-border-low divide-y divide-border-low animate-[fadeIn_0.2s_ease-out]">
                    {gameState.recentWinners.filter(w => w.address !== DEFAULT_PUBKEY).map((winner, idx) => (
                        <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-cream/5">
                            <div className="flex items-center gap-3">
                                <span className="text-muted text-xs">Round {winner.roundNumber}</span>
                                <span className="text-xs font-mono font-bold text-foreground break-all">{formatAddress(winner.address)}</span>
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

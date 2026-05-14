import { GameState } from "../../generated/higher/accounts";
import { Address } from "@solana/kit";

type HowItWorksProps = {
    gameState: GameState | null;
    gameStatePda: Address | null;
};

export function HowItWorks({ gameState, gameStatePda }: HowItWorksProps) {
    return (
        <div className="rounded-xl border border-border-low bg-card/50 px-5 py-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.15em] text-muted font-semibold">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
                <div className="flex gap-2 items-start">
                    <span className="text-primary">▸</span>
                    <span>Pay SOL to become the King</span>
                </div>
                <div className="flex gap-2 items-start">
                    <span className="text-primary">▸</span>
                    <span>Choose your multiplier (1.25x – 3x)</span>
                </div>
                <div className="flex gap-2 items-start">
                    <span className="text-primary">▸</span>
                    <span>Timer starts when first King is crowned (2 min)</span>
                </div>
                <div className="flex gap-2 items-start">
                    <span className="text-primary">▸</span>
                    <span>Last King standing claims the whole pot</span>
                </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-border-low">
                {gameStatePda && (
                    <p className="flex-1 truncate font-mono text-[10px] text-muted/60">
                        Game PDA: {gameStatePda}
                    </p>
                )}
                {gameState && (
                    <p className="font-mono text-[10px] text-muted/60">
                        Round #{gameState.roundNumber}
                    </p>
                )}
            </div>
        </div>
    );
}

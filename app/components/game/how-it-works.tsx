import { GameState } from "../../generated/higher/accounts";
import { Address } from "@solana/kit";
import { Coins, X, Timer, Crown } from "lucide-react";

type HowItWorksProps = {
    gameState: GameState | null;
    gameStatePda: Address | null;
};

export function HowItWorks({ gameState, gameStatePda }: HowItWorksProps) {
    const steps = [
        { icon: <Coins size={16} />, text: "Pay SOL to become the King" },
        { icon: <X size={16} />, text: "Your multiplier (1.25x – 3x) sets your price" },
        { icon: <Timer size={16} />, text: "Timer starts when first King is crowned (2 min)" },
        { icon: <Crown size={16} />, text: "Last King standing claims the whole pot" },
    ];

    return (
        <div className="glass-card rounded-2xl px-5 py-5 space-y-4 animate-fadeInUp stagger-5 mt-4">
            <p className="text-xs uppercase tracking-widest text-muted font-bold">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className="flex gap-3 items-start group"
                    >
                        <span className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-primary bg-primary/10 group-hover:bg-primary/20 transition-colors mt-0.5">
                            {step.icon}
                        </span>
                        <span className="text-xs text-muted leading-relaxed">{step.text}</span>
                    </div>
                ))}
            </div>
            <div className="border-t border-dashed border-border-low mt-4 pt-4 flex items-center justify-between" />
            <div className="flex items-center gap-3">
                {gameStatePda && (
                    <p className="flex-1 truncate font-mono text-[10px] text-muted/40">
                        PDA: {gameStatePda}
                    </p>
                )}
                {gameState && (
                    <p className="font-mono text-[10px] text-muted/40 flex-shrink-0">
                        Round #{gameState.roundNumber}
                    </p>
                )}
            </div>
        </div>
    );
}

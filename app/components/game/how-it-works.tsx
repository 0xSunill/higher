import { GameState } from "../../generated/higher/accounts";
import { Address } from "@solana/kit";

type HowItWorksProps = {
    gameState: GameState | null;
    gameStatePda: Address | null;
};

const steps = [
    { icon: "💰", text: "Pay SOL to become the King" },
    { icon: "✖️", text: "Your multiplier (1.25x – 3x) sets your price" },
    { icon: "⏱️", text: "Timer starts when first King is crowned (2 min)" },
    { icon: "👑", text: "Last King standing claims the whole pot" },
];

export function HowItWorks({ gameState, gameStatePda }: HowItWorksProps) {
    return (
        <div className="glass-card rounded-2xl px-5 py-5 space-y-4 animate-fadeInUp stagger-5">
            <p className="section-label">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className="flex gap-3 items-center rounded-xl px-3 py-2.5 transition-colors duration-300 hover:bg-[rgba(255,255,255,0.02)]"
                    >
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                            style={{ background: 'var(--surface-1)' }}
                        >
                            {step.icon}
                        </span>
                        <span className="text-xs text-muted leading-relaxed">{step.text}</span>
                    </div>
                ))}
            </div>
            <div className="divider-gold" />
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

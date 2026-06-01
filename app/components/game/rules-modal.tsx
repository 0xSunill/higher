"use client";

import { useState } from "react";

type RulesModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
    const [activeTab, setActiveTab] = useState(0);

    if (!isOpen) return null;

    const tabs = [
        { label: "How to Play", icon: "🎮" },
        { label: "Multipliers", icon: "✖️" },
        { label: "Example", icon: "📊" },
        { label: "Strategy", icon: "🧠" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border-low bg-card shadow-[0_40px_120px_-30px_rgba(255,215,0,0.15)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-card border-b border-border-low px-6 pt-5 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">📜</span>
                            <div>
                                <h2 className="text-xl font-bold text-gold-gradient">Rules & How to Play</h2>
                                <p className="text-xs text-muted mt-0.5">Everything you need to know</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-border-low bg-cream/30 p-2 text-muted hover:text-foreground hover:border-primary/30 transition cursor-pointer"
                            aria-label="Close rules"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1.5">
                        {tabs.map((tab, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer
                                    ${activeTab === i
                                        ? "bg-primary/15 text-primary border border-primary/30"
                                        : "bg-cream/20 text-muted border border-transparent hover:text-foreground hover:bg-cream/40"
                                    }`}
                            >
                                <span className="block text-base mb-0.5">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-4">
                    {activeTab === 0 && <HowToPlayTab />}
                    {activeTab === 1 && <MultipliersTab />}
                    {activeTab === 2 && <ExampleTab />}
                    {activeTab === 3 && <StrategyTab />}
                </div>
            </div>
        </div>
    );
}

function StepCard({ step, icon, title, description }: { step: number; icon: string; title: string; description: string }) {
    return (
        <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                {step}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>{icon}</span> {title}
                </p>
                <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function HowToPlayTab() {
    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs text-primary font-semibold mb-1">🏆 Goal</p>
                <p className="text-sm text-foreground leading-relaxed">
                    Be the <strong>last King standing</strong> when the timer hits zero to win the entire prize pot!
                </p>
            </div>

            <div className="space-y-4">
                <StepCard
                    step={1}
                    icon="👛"
                    title="Connect Your Wallet"
                    description="Connect a Solana wallet (Phantom, Solflare, etc.) to get started."
                />
                <StepCard
                    step={2}
                    icon="👑"
                    title="Become the First King"
                    description="The first player pays a fixed base price of 0.01 SOL to become King. This starts the countdown timer (2 minutes)."
                />
                <StepCard
                    step={3}
                    icon="✖️"
                    title="Choose Your Multiplier"
                    description="Pick a multiplier from 1.25x to 3.0x. This determines how much YOU pay: base price × your multiplier. Higher multiplier = bigger pot, but costs you more!"
                />
                <StepCard
                    step={4}
                    icon="⚔️"
                    title="Dethrone the King"
                    description="Pay the multiplied price to become the new King. The timer resets, and the pot grows with each payment."
                />
                <StepCard
                    step={5}
                    icon="⏰"
                    title="Win the Pot"
                    description="When the timer expires and no one outbids you, claim the entire prize pot! All the SOL accumulated goes to the last King."
                />
            </div>

            <div className="rounded-xl border border-border-low bg-cream/30 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>🛡️</span> Anti-Sniping Protection
                </p>
                <p className="text-xs text-muted leading-relaxed">
                    If someone bids with <strong>less than 1 minute</strong> remaining, the timer extends by 1 minute instead of the full 2 minutes. This prevents last-second sniping!
                </p>
            </div>
        </div>
    );
}

function MultipliersTab() {
    const multipliers = [
        { label: "1.25x", risk: "Low", cost: "0.0125", color: "text-green-400", bar: "w-[21%]", bgColor: "bg-green-400/20" },
        { label: "1.5x", risk: "Low-Med", cost: "0.0150", color: "text-emerald-400", bar: "w-[25%]", bgColor: "bg-emerald-400/20" },
        { label: "1.75x", risk: "Medium", cost: "0.0175", color: "text-yellow-400", bar: "w-[29%]", bgColor: "bg-yellow-400/20" },
        { label: "2.0x", risk: "Medium", cost: "0.0200", color: "text-orange-400", bar: "w-[33%]", bgColor: "bg-orange-400/20" },
        { label: "2.5x", risk: "High", cost: "0.0250", color: "text-red-400", bar: "w-[42%]", bgColor: "bg-red-400/20" },
        { label: "3.0x", risk: "Very High", cost: "0.0300", color: "text-red-500", bar: "w-[50%]", bgColor: "bg-red-500/20" },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs text-primary font-semibold mb-1">How Multipliers Work</p>
                <p className="text-sm text-foreground leading-relaxed">
                    Your multiplier determines <strong>how much you pay</strong>. The price you pay = base price × your chosen multiplier. 
                    Your payment then becomes the new base price for the next player.
                </p>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted font-semibold">
                    Multiplier Breakdown (base = 0.01 SOL)
                </p>
                {multipliers.map((m) => (
                    <div key={m.label} className="rounded-lg border border-border-low bg-cream/20 px-3 py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-foreground">{m.label}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.bgColor} ${m.color}`}>
                                {m.risk}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full bg-border-low overflow-hidden">
                                <div className={`h-full rounded-full ${m.bar}`} style={{ background: 'var(--gradient-crown)' }} />
                            </div>
                            <span className="text-xs font-mono text-muted">{m.cost} SOL</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExampleTab() {
    const rounds = [
        { player: "Player A", multiplier: "—", paid: "0.0100", pot: "0.0100", note: "First King (fixed price)" },
        { player: "Player B", multiplier: "2.0x", paid: "0.0200", pot: "0.0300", note: "Pays 0.01 × 2.0" },
        { player: "Player C", multiplier: "1.5x", paid: "0.0300", pot: "0.0600", note: "Pays 0.02 × 1.5" },
        { player: "Player D", multiplier: "3.0x", paid: "0.0900", pot: "0.1500", note: "Pays 0.03 × 3.0" },
        { player: "Player E", multiplier: "1.25x", paid: "0.1125", pot: "0.2625", note: "Pays 0.09 × 1.25" },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs text-primary font-semibold mb-1">📊 Example Game Scenario</p>
                <p className="text-sm text-foreground leading-relaxed">
                    Watch how the pot grows as each player chooses their multiplier. The base price is 0.01 SOL.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border-low">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-0 bg-cream/30 px-3 py-2 text-[10px] uppercase tracking-wider text-muted font-semibold border-b border-border-low">
                    <div className="col-span-2">Player</div>
                    <div className="col-span-2 text-center">Multi</div>
                    <div className="col-span-3 text-right">Paid</div>
                    <div className="col-span-3 text-right">Total Pot</div>
                    <div className="col-span-2"></div>
                </div>

                {/* Table Rows */}
                {rounds.map((r, i) => (
                    <div
                        key={i}
                        className={`grid grid-cols-12 gap-0 px-3 py-2.5 items-center text-xs border-b border-border-low last:border-0
                            ${i === rounds.length - 1 ? "bg-primary/5" : ""}`}
                    >
                        <div className="col-span-2 font-semibold text-foreground">
                            {i === rounds.length - 1 ? "👑 " : ""}{r.player.replace("Player ", "")}
                        </div>
                        <div className="col-span-2 text-center font-mono text-muted">{r.multiplier}</div>
                        <div className="col-span-3 text-right font-mono text-foreground">{r.paid}</div>
                        <div className="col-span-3 text-right font-mono text-gold-gradient font-bold">{r.pot}</div>
                        <div className="col-span-2"></div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
                <p className="text-xs font-semibold text-green-400 flex items-center gap-2">
                    <span>🎉</span> Result
                </p>
                <p className="text-xs text-muted leading-relaxed mt-1">
                    If Player E is the last King when the timer expires, they claim the entire <strong className="text-green-400">0.2625 SOL</strong> pot — 
                    having only paid <strong>0.1125 SOL</strong>. That&apos;s a <strong className="text-green-400">2.33x profit</strong>!
                </p>
            </div>
        </div>
    );
}

function StrategyTab() {
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs text-primary font-semibold mb-1">🧠 Tips & Strategy</p>
                <p className="text-sm text-foreground leading-relaxed">
                    Understanding the game mechanics gives you an edge. Here are some strategies to consider.
                </p>
            </div>

            <div className="space-y-3">
                <StrategyCard
                    icon="🐢"
                    title="Low Multiplier (1.25x)"
                    description="Cheaper entry = less risk. But the pot grows slowly, making it more attractive for others to wait."
                    tag="Conservative"
                    tagColor="text-green-400 bg-green-400/15"
                />
                <StrategyCard
                    icon="🚀"
                    title="High Multiplier (3.0x)"
                    description="Expensive entry = bigger pot. Deters casual players but attracts whales. High risk, high reward."
                    tag="Aggressive"
                    tagColor="text-red-400 bg-red-400/15"
                />
                <StrategyCard
                    icon="⏱️"
                    title="Timing Matters"
                    description="Bidding in the last 60 seconds triggers anti-snipe (1 min extension only). Use this to put pressure on opponents!"
                    tag="Advanced"
                    tagColor="text-purple-400 bg-purple-400/15"
                />
                <StrategyCard
                    icon="💰"
                    title="Watch the Pot"
                    description="The larger the pot, the more incentive others have to bid. Consider the pot-to-cost ratio before committing."
                    tag="Key Insight"
                    tagColor="text-yellow-400 bg-yellow-400/15"
                />
                <StrategyCard
                    icon="🔄"
                    title="New Round Opportunity"
                    description="When a game expires, anyone can start a new round at the base 0.01 SOL price. Unclaimed prizes carry over to the new pot!"
                    tag="Opportunity"
                    tagColor="text-blue-400 bg-blue-400/15"
                />
            </div>
        </div>
    );
}

function StrategyCard({ icon, title, description, tag, tagColor }: { icon: string; title: string; description: string; tag: string; tagColor: string }) {
    return (
        <div className="rounded-lg border border-border-low bg-cream/20 px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>{icon}</span> {title}
                </p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor}`}>
                    {tag}
                </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{description}</p>
        </div>
    );
}

export function RulesButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-2 rounded-xl border border-border-low bg-card/80 px-4 py-2.5 text-sm font-semibold text-muted transition-all duration-200 hover:border-primary/30 hover:text-primary hover:shadow-[0_8px_30px_-15px_rgba(255,215,0,0.15)] hover:-translate-y-0.5 cursor-pointer"
        >
            <span className="text-lg transition-transform duration-200 group-hover:scale-110">📜</span>
            <span>How to Play</span>
        </button>
    );
}

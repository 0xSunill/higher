"use client";

import { useState } from "react";
import { Gamepad2, X, BarChart2, Brain, Scroll, Wallet, Crown, Swords, Timer, ShieldAlert, PartyPopper, Turtle, Rocket, Coins, RotateCcw } from "lucide-react";

type RulesModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
    const [activeTab, setActiveTab] = useState(0);

    if (!isOpen) return null;

    const tabs = [
        { label: "How to Play", icon: <Gamepad2 size={18} /> },
        { label: "Multipliers", icon: <X size={18} /> },
        { label: "Example", icon: <BarChart2 size={18} /> },
        { label: "Strategy", icon: <Brain size={18} /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl animate-fadeInUp shadow-[0_0_50px_rgba(124,219,255,0.05)] border border-border-low"
                style={{ background: 'var(--card-solid)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 px-6 pt-5 pb-4" style={{ background: 'var(--card-solid)', borderBottom: '1px solid var(--border-low)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Scroll size={24} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground drop-shadow-sm">Rules & How to Play</h2>
                                <p className="text-xs text-muted mt-0.5">Everything you need to know</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-xl p-2.5 transition-all duration-300 cursor-pointer hover:rotate-90 text-muted hover:text-foreground"
                            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-low)' }}
                            aria-label="Close rules"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--surface-0)' }}>
                        {tabs.map((tab, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all duration-300 cursor-pointer flex flex-col items-center gap-1.5
                                    ${activeTab === i
                                        ? "text-primary shadow-sm"
                                        : "text-muted hover:text-foreground"
                                    }`}
                                style={activeTab === i ? {
                                    background: 'var(--accent-dim)',
                                    border: '1px solid rgba(124, 219, 255, 0.15)',
                                } : { border: '1px solid transparent' }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-4 animate-fadeIn">
                    {activeTab === 0 && <HowToPlayTab />}
                    {activeTab === 1 && <MultipliersTab />}
                    {activeTab === 2 && <ExampleTab />}
                    {activeTab === 3 && <StrategyTab />}
                </div>
            </div>
        </div>
    );
}

function StepCard({ step, icon, title, description }: { step: number; icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-3.5 items-start group">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors duration-300"
                style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(124, 219, 255, 0.1)',
                }}
            >
                {step}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary/70">{icon}</span> {title}
                </p>
                <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function HowToPlayTab() {
    return (
        <div className="space-y-5">
            <div className="rounded-xl px-4 py-3.5" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124, 219, 255, 0.1)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                    <TrophyIcon size={14} /> Goal
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                    Be the <strong>last King standing</strong> when the timer hits zero to win the entire prize pot!
                </p>
            </div>

            <div className="space-y-5 py-2">
                <StepCard step={1} icon={<Wallet size={16} />} title="Connect Your Wallet" description="Connect a Solana wallet (Phantom, Solflare, etc.) to get started." />
                <StepCard step={2} icon={<Crown size={16} />} title="Become the First King" description="The first player pays a fixed base price of 0.01 SOL to become King. This starts the countdown timer (2 minutes)." />
                <StepCard step={3} icon={<X size={16} />} title="Choose Your Multiplier" description="Pick a multiplier from 1.25x to 3.0x. This determines how much YOU pay: base price × your multiplier. Higher multiplier = bigger pot, but costs you more!" />
                <StepCard step={4} icon={<Swords size={16} />} title="Dethrone the King" description="Pay the multiplied price to become the new King. The timer resets, and the pot grows with each payment." />
                <StepCard step={5} icon={<Timer size={16} />} title="Win the Pot" description="When the timer expires and no one outbids you, claim the entire prize pot! All the SOL accumulated goes to the last King." />
            </div>

            <div className="rounded-xl px-4 py-3.5 space-y-2" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-low)' }}>
                <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <ShieldAlert size={14} className="text-orange-400" /> Anti-Sniping Protection
                </p>
                <p className="text-xs text-muted leading-relaxed">
                    If someone bids with <strong>less than 1 minute</strong> remaining, the timer extends by 1 minute instead of the full 2 minutes. This prevents last-second sniping!
                </p>
            </div>
        </div>
    );
}

// Temporary TrophyIcon wrapper to avoid importing Trophy twice
function TrophyIcon(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>;
}

function MultipliersTab() {
    const multipliers = [
        { label: "1.25x", risk: "Low", cost: "0.0125", color: "#34d399", pct: 21 },
        { label: "1.5x", risk: "Low-Med", cost: "0.0150", color: "#2dd4bf", pct: 25 },
        { label: "1.75x", risk: "Medium", cost: "0.0175", color: "#fbbf24", pct: 29 },
        { label: "2.0x", risk: "Medium", cost: "0.0200", color: "#f97316", pct: 33 },
        { label: "2.5x", risk: "High", cost: "0.0250", color: "#ef4444", pct: 42 },
        { label: "3.0x", risk: "Very High", cost: "0.0300", color: "#dc2626", pct: 50 },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-xl px-4 py-3.5" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124, 219, 255, 0.1)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                    <X size={14} /> How Multipliers Work
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                    Your multiplier determines <strong>how much you pay</strong>. The price you pay = base price × your chosen multiplier. 
                    Your payment then becomes the new base price for the next player.
                </p>
            </div>

            <div className="space-y-2">
                <p className="section-label">
                    Multiplier Breakdown (base = 0.01 SOL)
                </p>
                {multipliers.map((m) => (
                    <div key={m.label} className="rounded-xl px-4 py-3" style={{ background: 'var(--surface-0)', border: '1px solid var(--border-low)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-foreground">{m.label}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                style={{
                                    background: `${m.color}15`,
                                    color: m.color,
                                    border: `1px solid ${m.color}20`,
                                }}
                            >
                                {m.risk}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${m.pct}%`,
                                        background: `linear-gradient(90deg, ${m.color}80, ${m.color})`,
                                        boxShadow: `0 0 8px ${m.color}30`,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-mono text-muted min-w-[4.5rem] text-right">{m.cost} SOL</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExampleTab() {
    const rounds = [
        { player: "Player A", multiplier: "—", paid: "0.0100", pot: "0.0100", note: "First King" },
        { player: "Player B", multiplier: "2.0x", paid: "0.0200", pot: "0.0300", note: "Pays 0.01 × 2.0" },
        { player: "Player C", multiplier: "1.5x", paid: "0.0300", pot: "0.0600", note: "Pays 0.02 × 1.5" },
        { player: "Player D", multiplier: "3.0x", paid: "0.0900", pot: "0.1500", note: "Pays 0.03 × 3.0" },
        { player: "Player E", multiplier: "1.25x", paid: "0.1125", pot: "0.2625", note: "Pays 0.09 × 1.25" },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-xl px-4 py-3.5" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124, 219, 255, 0.1)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                    <BarChart2 size={14} /> Example Game Scenario
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                    Watch how the pot grows as each player chooses their multiplier. The base price is 0.01 SOL.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--border-low)' }}>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-0 px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold" style={{ background: 'var(--surface-1)', color: 'var(--muted)', borderBottom: '1px solid var(--border-low)' }}>
                    <div className="col-span-4">Player</div>
                    <div className="col-span-2 text-center">Multi</div>
                    <div className="col-span-3 text-right">Paid</div>
                    <div className="col-span-3 text-right">Pot</div>
                </div>

                {/* Table Rows */}
                {rounds.map((r, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-12 gap-0 px-4 py-3 items-center text-xs"
                        style={{
                            background: i === rounds.length - 1 ? 'var(--accent-dim)' : 'transparent',
                            borderBottom: i < rounds.length - 1 ? '1px solid var(--border-low)' : 'none',
                        }}
                    >
                        <div className="col-span-4 font-semibold text-foreground flex items-center gap-1.5">
                            {i === rounds.length - 1 ? <Crown size={12} className="text-primary" /> : null}
                            {r.player.replace("Player ", "")}
                        </div>
                        <div className="col-span-2 text-center font-mono text-muted">{r.multiplier}</div>
                        <div className="col-span-3 text-right font-mono text-foreground">{r.paid}</div>
                        <div className="col-span-3 text-right font-mono text-success font-bold">{r.pot}</div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl px-4 py-3.5" style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.1)' }}>
                <p className="text-xs font-semibold flex items-center gap-2" style={{ color: '#34d399' }}>
                    <PartyPopper size={14} /> Result
                </p>
                <p className="text-xs text-muted leading-relaxed mt-1">
                    If Player E is the last King when the timer expires, they claim the entire <strong style={{ color: '#34d399' }}>0.2625 SOL</strong> pot — 
                    having only paid <strong>0.1125 SOL</strong>. That&apos;s a <strong style={{ color: '#34d399' }}>2.33x profit</strong>!
                </p>
            </div>
        </div>
    );
}

function StrategyTab() {
    return (
        <div className="space-y-4">
            <div className="rounded-xl px-4 py-3.5" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124, 219, 255, 0.1)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                    <Brain size={14} /> Tips & Strategy
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                    Understanding the game mechanics gives you an edge. Here are some strategies to consider.
                </p>
            </div>

            <div className="space-y-3">
                <StrategyCard icon={<Turtle size={16} />} title="Low Multiplier (1.25x)" description="Cheaper entry = less risk. But the pot grows slowly, making it more attractive for others to wait." tag="Conservative" tagColor="#34d399" />
                <StrategyCard icon={<Rocket size={16} />} title="High Multiplier (3.0x)" description="Expensive entry = bigger pot. Deters casual players but attracts whales. High risk, high reward." tag="Aggressive" tagColor="#ef4444" />
                <StrategyCard icon={<Timer size={16} />} title="Timing Matters" description="Bidding in the last 60 seconds triggers anti-snipe (1 min extension only). Use this to put pressure on opponents!" tag="Advanced" tagColor="#a78bfa" />
                <StrategyCard icon={<Coins size={16} />} title="Watch the Pot" description="The larger the pot, the more incentive others have to bid. Consider the pot-to-cost ratio before committing." tag="Key Insight" tagColor="#7cdbff" />
                <StrategyCard icon={<RotateCcw size={16} />} title="New Round Opportunity" description="When a game expires, anyone can start a new round at the base 0.01 SOL price. Unclaimed prizes carry over to the new pot!" tag="Opportunity" tagColor="#60a5fa" />
            </div>
        </div>
    );
}

function StrategyCard({ icon, title, description, tag, tagColor }: { icon: React.ReactNode; title: string; description: string; tag: string; tagColor: string }) {
    return (
        <div className="rounded-xl px-4 py-3.5 transition-colors duration-300 hover:bg-[rgba(255,255,255,0.02)]"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-low)' }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span style={{ color: tagColor }}>{icon}</span> {title}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                        background: `${tagColor}12`,
                        color: tagColor,
                        border: `1px solid ${tagColor}20`,
                    }}
                >
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
            className="group inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
            style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-low)',
                color: 'var(--muted)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(124, 219, 255, 0.15)';
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 8px 32px -12px rgba(124, 219, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-low)';
                e.currentTarget.style.color = 'var(--muted)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <Scroll size={18} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <span>How to Play</span>
        </button>
    );
}

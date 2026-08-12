"use client";
import { useState } from "react";
import { GameCard } from "./components/game-card";
import { RulesModal } from "./components/game/rules-modal";
import { Nav } from "./components/nav";

export default function Home() {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground">
      {/* Ambient background effects */}
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-8 py-6">
        <Nav onRulesClick={() => setShowRules(true)} />

        {/* Rules Modal */}
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

        {/* Main Game Interface (Two-Column Layout) */}
        <GameCard />

        {/* Footer */}
        <footer className="text-center pb-8 pt-8 mt-auto">
          <div className="divider-aurora mx-auto w-16 mb-4" />
          <p className="text-[10px] text-muted/40 uppercase tracking-[0.2em] font-medium">
            Built on Solana Devnet • Anchor Framework
          </p>
        </footer>
      </main>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { GameCard } from "./components/game-card";
import { RulesModal, RulesButton } from "./components/game/rules-modal";

export default function Home() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();
  const [showRules, setShowRules] = useState(false);

  const address = wallet?.account.address.toString();

  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground">
      {/* Ambient background effects */}
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 sm:px-6 py-16">
        {/* Header */}
        <header className="text-center space-y-5 animate-fadeInUp">
          <div className="inline-flex items-center justify-center">
            <span className="text-6xl animate-crown-float drop-shadow-[0_0_30px_rgba(245,197,24,0.2)]">👑</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gold-shimmer">
              HIGHER
            </h1>
            <div className="divider-gold mx-auto w-24 my-3" />
            <p className="text-xs uppercase tracking-[0.25em] text-muted font-medium">
              King of the Hill on Solana
            </p>
          </div>
          <p className="max-w-md mx-auto text-sm leading-relaxed text-muted/80">
            Pay SOL to become the reigning King. Choose your multiplier to set your price.
            When the timer expires, the last King standing claims the entire pot.
          </p>
          <div className="pt-1 flex items-center justify-center gap-3">
            <RulesButton onClick={() => setShowRules(true)} />
          </div>
        </header>

        {/* Rules Modal */}
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

        {/* Wallet Connection */}
        <section className="w-full glass-card rounded-2xl p-5 animate-fadeInUp stagger-1">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold">Wallet</p>
              <p className="text-xs text-muted">
                {status === "connected"
                  ? "Connected to Solana devnet"
                  : "Connect a wallet to play"}
              </p>
            </div>
            <span
              className={`status-badge ${status === "connected" ? "status-badge-live" : "status-badge-offline"}`}
            >
              {status === "connected" ? "Live" : "Offline"}
            </span>
          </div>

          {status !== "connected" ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect(connector.id)}
                  disabled={status === "connecting"}
                  className="wallet-connector text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">{connector.name}</span>
                    <span className="text-[10px] text-muted">
                      {status === "connecting"
                        ? "Connecting…"
                        : "Tap to connect"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full bg-border-low transition-colors"
                    style={{ transition: 'all 0.3s' }}
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex-1 truncate rounded-xl border border-border-low bg-surface-0 px-4 py-2.5 font-mono text-xs" style={{ background: 'var(--surface-0)' }}>
                {address}
              </span>
              <button
                onClick={() => disconnect()}
                className="rounded-xl border border-border-low px-4 py-2.5 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/20 hover:text-red-400 cursor-pointer"
                style={{ background: 'var(--surface-0)' }}
              >
                Disconnect
              </button>
            </div>
          )}
        </section>

        {/* Game Card */}
        <GameCard />

        {/* Footer */}
        <footer className="text-center pb-8 pt-4">
          <div className="divider-gold mx-auto w-16 mb-4" />
          <p className="text-[10px] text-muted/40 uppercase tracking-[0.2em] font-medium">
            Built on Solana Devnet • Anchor Framework
          </p>
        </footer>
      </main>
    </div>
  );
}

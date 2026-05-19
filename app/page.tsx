"use client";
import { useWalletConnection } from "@solana/react-hooks";
import { GameCard } from "./components/game-card";

export default function Home() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();

  const address = wallet?.account.address.toString();



//dev wallet 2.47357
//main 2.46565 



// main staring -
// dev stariring 



  return (
    <div className="relative min-h-screen overflow-x-clip text-foreground">
      <main className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 sm:px-6 py-12">
        {/* Header */}
        <header className="text-center space-y-3">
          <div className="text-5xl mb-2">👑</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gold-gradient">
            HIGHER
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            King of the Hill on Solana
          </p>
          <p className="max-w-xl mx-auto text-sm leading-relaxed text-muted">
            Pay SOL to become the reigning King. Choose your multiplier (1.25x–3x)
            to set the next price. When the timer expires, the last King standing
            claims the entire pot.
          </p>
        </header>

        {/* Wallet Connection */}
        <section className="w-full max-w-2xl mx-auto rounded-2xl border border-border-low bg-card p-5 shadow-[0_20px_60px_-40px_rgba(255,215,0,0.08)]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold">Wallet</p>
              <p className="text-xs text-muted">
                {status === "connected"
                  ? "Connected to Solana testnet"
                  : "Connect a wallet to play"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${status === "connected"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/10 text-red-400"
                }`}
            >
              {status === "connected" ? "● Live" : "○ Offline"}
            </span>
          </div>

          {status !== "connected" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect(connector.id)}
                  disabled={status === "connecting"}
                  className="group flex items-center justify-between rounded-xl border border-border-low bg-card px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_30px_-15px_rgba(255,215,0,0.15)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex flex-col">
                    <span className="text-sm">{connector.name}</span>
                    <span className="text-[10px] text-muted">
                      {status === "connecting"
                        ? "Connecting…"
                        : "Tap to connect"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full bg-border-low transition group-hover:bg-primary/60"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex-1 truncate rounded-lg border border-border-low bg-cream px-3 py-2 font-mono text-xs">
                {address}
              </span>
              <button
                onClick={() => disconnect()}
                className="rounded-lg border border-border-low bg-card px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          )}
        </section>

        {/* Game Card */}
        <GameCard />

        {/* Footer */}
        <footer className="text-center pb-8">
          <p className="text-[10px] text-muted/50 uppercase tracking-[0.15em]">
            Built on Solana Testnet • Anchor Framework
          </p>
        </footer>
      </main>
    </div>
  );
}

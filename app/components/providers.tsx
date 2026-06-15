"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { PropsWithChildren, useEffect, useState } from "react";

import { autoDiscover, createClient } from "@solana/client";
import type { SolanaClient } from "@solana/client";

export function Providers({ children }: PropsWithChildren) {
  const [client, setClient] = useState<SolanaClient | null>(null);

  useEffect(() => {
    const solanaClient = createClient({
      endpoint: "https://api.devnet.solana.com",
      walletConnectors: autoDiscover(),
    });
    setClient(solanaClient);
  }, []);

  if (!client) {
    return null;
  }

  return <SolanaProvider client={client}>{children}</SolanaProvider>;
}

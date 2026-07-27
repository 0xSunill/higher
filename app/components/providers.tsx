"use client";

import { SolanaProvider } from "@solana/react-hooks";
import { PropsWithChildren, useState } from "react";

import { autoDiscover, createClient } from "@solana/client";
import type { SolanaClient } from "@solana/client";

export function Providers({ children }: PropsWithChildren) {
  const [client] = useState<SolanaClient | null>(() =>
    typeof window !== "undefined"
      ? createClient({
          endpoint: "https://api.devnet.solana.com",
          walletConnectors: autoDiscover(),
        })
      : null
  );

  if (!client) {
    return null;
  }

  return <SolanaProvider client={client}>{children}</SolanaProvider>;
}

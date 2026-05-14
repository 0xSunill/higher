import { Address } from "@solana/kit";

const LAMPORTS_PER_SOL = 1_000_000_000n;

export function formatAddress(address: string | Address | undefined): string {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatSol(lamports: bigint): string {
    const sol = Number(lamports) / Number(LAMPORTS_PER_SOL);
    return sol.toFixed(4);
}

export function formatCountdown(seconds: number): string {
    if (seconds <= 0) return "EXPIRED";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${String(m).padStart(2, "0")}m`);
    parts.push(`${String(s).padStart(2, "0")}s`);
    return parts.join(" ");
}

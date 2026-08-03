"use client";

import { useState, useRef, useEffect } from "react";
import { Crown, Scroll, Wallet, ChevronDown, LogOut } from "lucide-react";
import { useWalletConnection } from "@solana/react-hooks";

export function Nav({ onRulesClick }: { onRulesClick: () => void }) {
    const { connectors, connect, disconnect, wallet, status } = useWalletConnection();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const walletAddress = wallet?.account.address;
    const shortAddress = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "";

    return (
        <nav className="relative z-50 flex items-center justify-between animate-fadeInUp w-full mb-8 px-6 py-4 rounded-2xl sm:rounded-full bg-surface-1/40 backdrop-blur-3xl border border-border-low shadow-2xl">
            <div className="flex items-center gap-3">
                <div className="text-primary bg-primary/10 p-2 rounded-xl sm:rounded-full border border-primary/20">
                    <Crown size={20} strokeWidth={2} />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground drop-shadow-md">
                    HIGHER
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onRulesClick}
                    className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary transition-colors"
                >
                    <Scroll size={16} />
                    How to Play
                </button>

                <div className="relative" ref={dropdownRef}>
                    {status === "connected" ? (
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 rounded-full border border-border-low bg-surface-1 px-4 py-2 text-sm font-semibold transition-all hover:bg-surface-2"
                        >
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            {shortAddress}
                            <ChevronDown size={14} className={`text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                    ) : (
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="btn-aurora rounded-full px-5 py-2 text-sm flex items-center gap-2"
                        >
                            <Wallet size={16} />
                            {status === "connecting" ? "Connecting..." : "Connect"}
                        </button>
                    )}

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card p-2 shadow-2xl z-50 animate-fadeIn">
                            {status === "connected" ? (
                                <button
                                    onClick={() => {
                                        disconnect();
                                        setDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut size={16} /> Disconnect Wallet
                                </button>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted px-3 py-2 uppercase tracking-wider">Available Wallets</p>
                                    {connectors.length === 0 ? (
                                        <p className="text-sm text-muted px-3 py-2">No wallets found</p>
                                    ) : (
                                        connectors.map((connector) => (
                                            <button
                                                key={connector.id}
                                                onClick={() => {
                                                    connect(connector.id);
                                                    setDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                                            >
                                                {connector.name}
                                                <span className="h-2 w-2 rounded-full bg-border-low" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

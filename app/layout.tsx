import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Higher — King of the Hill on Solana",
  description:
    "Pay SOL to become the King. The last one standing claims the entire pot. Built on Solana testnet.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        {/* Animated aurora wave lines — fixed background */}
        <div className="bg-aurora-lines">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bg-lines.svg"
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Noise texture overlay */}
        <div className="bg-noise" />

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AULOS NEWS",
  description: "A personal world-intelligence platform built on traceable evidence.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

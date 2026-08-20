import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AULOS NEWS",
  description: "A personal world-intelligence platform built on traceable evidence.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  metadataBase: new URL("https://aulos-news.ian-g-lacey2.chatgpt.site"),
  openGraph: { title: "AULOS NEWS", description: "Evidence before narrative. A personal world-intelligence platform.", images: [{ url: "/og.png", width: 1731, height: 909, alt: "AULOS NEWS — Evidence before narrative." }] },
  twitter: { card: "summary_large_image", title: "AULOS NEWS", description: "Evidence before narrative.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learnivelle — Understand together",
  description: "Peer explanations, shared study notes and a focused place to learn.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed from Geist to Inter
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SetGo | Corporate Transport Automation",
  description: "Unified corporate transport platform for automated dispatch, real-time tracking, and verified rides.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

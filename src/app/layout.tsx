import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DebugPanel from "../components/DebugPanel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IG Follow Audit",
  description: "Audit your Instagram connections entirely client-side."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <DebugPanel />
      </body>
    </html>
  );
}

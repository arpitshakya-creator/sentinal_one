import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "SupplyChain Sentinel AI",
  description:
    "Real-time cyber risk intelligence for multi-tier supply chains — live CVE feeds, dependency graph, blast-radius simulation, and AI mitigation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <NavBar />
        <main className="mx-auto max-w-[1500px] px-5 py-6">{children}</main>
      </body>
    </html>
  );
}

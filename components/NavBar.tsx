"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/graph", label: "Graph" },
  { href: "/simulator", label: "Simulator" },
  { href: "/mitigation", label: "Mitigation" },
];

interface Status {
  ai_enabled: boolean;
  cve_count: number;
  kev_count: number;
}

export function NavBar() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg-soft/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-6 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
            </svg>
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">SupplyChain Sentinel AI</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Cyber Risk Intelligence
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-bg-elevated text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-xs">
          {status && (
            <>
              <span className="hidden items-center gap-1.5 text-slate-400 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-low" />
                {status.cve_count} live CVEs
              </span>
              <span className="hidden items-center gap-1.5 text-slate-400 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-critical" />
                {status.kev_count} actively exploited
              </span>
              <span
                className={`tag ${
                  status.ai_enabled
                    ? "bg-accent/15 text-accent"
                    : "bg-slate-700/40 text-slate-400"
                }`}
                title={
                  status.ai_enabled
                    ? "Claude AI agents active"
                    : "Set ANTHROPIC_API_KEY to enable AI narrative summaries"
                }
              >
                {status.ai_enabled ? "AI Active" : "AI Off"}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

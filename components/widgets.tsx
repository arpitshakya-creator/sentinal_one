"use client";

import type { RiskBand } from "@/lib/types";
import { bandClasses, BAND_LABEL, bandFromScore } from "@/lib/ui";

export function RiskBadge({ band, score }: { band?: RiskBand; score?: number }) {
  const b = band ?? bandFromScore(score ?? 0);
  return (
    <span className={`tag ${bandClasses(b)}`}>
      {BAND_LABEL[b]}
      {typeof score === "number" ? ` · ${score}` : ""}
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const band = bandFromScore(score);
  const color =
    band === "critical" ? "bg-risk-critical" : band === "medium" ? "bg-risk-medium" : "bg-risk-low";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, score)}%` }} />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "critical" | "medium" | "low" | "accent";
}) {
  const color =
    accent === "critical"
      ? "text-risk-critical"
      : accent === "medium"
      ? "text-risk-medium"
      : accent === "low"
      ? "text-risk-low"
      : accent === "accent"
      ? "text-accent"
      : "text-white";
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

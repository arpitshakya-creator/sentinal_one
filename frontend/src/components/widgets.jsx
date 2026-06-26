import { bandClasses, BAND_LABEL, bandFromScore } from "../lib/ui.js";

export function RiskBadge({ band, score }) {
  const b = band ?? bandFromScore(score ?? 0);
  return (
    <span className={`tag ${bandClasses(b)}`}>
      {BAND_LABEL[b]}
      {typeof score === "number" ? ` · ${score}` : ""}
    </span>
  );
}

export function ScoreBar({ score }) {
  const band = bandFromScore(score);
  const color =
    band === "critical" ? "bg-risk-critical" : band === "medium" ? "bg-risk-medium" : "bg-risk-low";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(100, score)}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint, accent }) {
  const theme =
    accent === "critical"
      ? { text: "text-risk-critical", rail: "bg-risk-critical" }
      : accent === "medium"
      ? { text: "text-risk-medium", rail: "bg-risk-medium" }
      : accent === "low"
      ? { text: "text-risk-low", rail: "bg-risk-low" }
      : accent === "accent"
      ? { text: "text-accent", rail: "bg-accent" }
      : { text: "text-slate-900", rail: "bg-slate-300" };
  return (
    <div className="card relative overflow-hidden">
      <span className={`absolute left-0 top-0 h-full w-1 ${theme.rail}`} />
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold tracking-tight ${theme.text}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

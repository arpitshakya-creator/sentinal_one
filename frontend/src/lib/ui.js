// Client-safe UI helpers (risk band utilities, formatting).

export function bandFromScore(score) {
  if (score >= 70) return "critical";
  if (score >= 40) return "medium";
  return "low";
}

export const BAND_HEX = {
  low: "#22c55e",
  medium: "#f59e0b",
  critical: "#ef4444",
};

export const BAND_LABEL = {
  low: "Low",
  medium: "Medium",
  critical: "Critical",
};

export function bandClasses(band) {
  switch (band) {
    case "critical":
      return "bg-risk-critical/15 text-risk-critical border border-risk-critical/30";
    case "medium":
      return "bg-risk-medium/15 text-risk-medium border border-risk-medium/30";
    default:
      return "bg-risk-low/15 text-risk-low border border-risk-low/30";
  }
}

export function fmtUsd(n) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

import type { CVE } from "./types";

// Live client for the NIST National Vulnerability Database (NVD) API v2.0.
// Docs: https://nvd.nist.gov/developers/vulnerabilities
const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

interface NvdCvssData {
  baseScore?: number;
  baseSeverity?: string;
}
interface NvdMetric {
  cvssData?: NvdCvssData;
  baseSeverity?: string;
}
interface NvdVuln {
  cve: {
    id: string;
    published?: string;
    lastModified?: string;
    descriptions?: { lang: string; value: string }[];
    metrics?: {
      cvssMetricV31?: NvdMetric[];
      cvssMetricV30?: NvdMetric[];
      cvssMetricV2?: NvdMetric[];
    };
  };
}
interface NvdResponse {
  vulnerabilities?: NvdVuln[];
}

function extractCvss(v: NvdVuln): { score: number; severity: string } {
  const m =
    v.cve.metrics?.cvssMetricV31?.[0] ||
    v.cve.metrics?.cvssMetricV30?.[0] ||
    v.cve.metrics?.cvssMetricV2?.[0];
  const score = m?.cvssData?.baseScore ?? 0;
  const severity = m?.cvssData?.baseSeverity ?? m?.baseSeverity ?? "UNKNOWN";
  return { score, severity };
}

export interface NvdQueryOptions {
  minCvss?: number;
  resultsPerPage?: number;
  apiKey?: string;
}

/** Fetch real, current CVEs from NVD for a given vendor/product keyword. */
export async function fetchCvesForKeyword(
  keyword: string,
  opts: NvdQueryOptions = {}
): Promise<CVE[]> {
  const { minCvss = 7.0, resultsPerPage = 25, apiKey = process.env.NVD_API_KEY } = opts;

  const url = new URL(NVD_BASE);
  url.searchParams.set("keywordSearch", keyword);
  url.searchParams.set("resultsPerPage", String(resultsPerPage));
  url.searchParams.set("noRejected", "");

  const headers: Record<string, string> = { "User-Agent": "SupplyChainSentinelAI/1.0" };
  if (apiKey) headers["apiKey"] = apiKey;

  // NVD intermittently returns 503/429 (Cloudflare throttling). Retry with backoff.
  let res: Response | null = null;
  let lastErr = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await delay(3000 * attempt);
    try {
      res = await fetch(url.toString(), { headers });
    } catch (e) {
      lastErr = (e as Error).message;
      continue;
    }
    if (res.ok) break;
    if (res.status !== 503 && res.status !== 429) break;
    lastErr = `status ${res.status}`;
  }
  if (!res || !res.ok) {
    throw new Error(`NVD API ${res?.status ?? ""} for "${keyword}": ${lastErr}`.trim());
  }
  const data = (await res.json()) as NvdResponse;
  const out: CVE[] = [];
  for (const v of data.vulnerabilities ?? []) {
    const { score, severity } = extractCvss(v);
    if (score < minCvss) continue;
    const description =
      v.cve.descriptions?.find((d) => d.lang === "en")?.value ??
      v.cve.descriptions?.[0]?.value ??
      "";
    out.push({
      id: v.cve.id,
      cvss: score,
      severity,
      description,
      published: v.cve.published ?? v.cve.lastModified ?? new Date().toISOString(),
      source: "NVD",
      vendor: keyword,
      product: null,
      known_exploited: false,
      url: `https://nvd.nist.gov/vuln/detail/${v.cve.id}`,
    });
  }
  // Highest severity first, capped.
  out.sort((a, b) => b.cvss - a.cvss);
  return out.slice(0, 8);
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

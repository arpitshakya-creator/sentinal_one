import type { CVE } from "./types";

// Live client for the CISA Known Exploited Vulnerabilities (KEV) catalog.
// This is the authoritative, free, public feed of CVEs known to be actively
// exploited in the wild. https://www.cisa.gov/known-exploited-vulnerabilities-catalog
const KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

interface KevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  knownRansomwareCampaignUse?: string;
}
interface KevCatalog {
  vulnerabilities?: KevEntry[];
}

let cache: { fetchedAt: number; entries: KevEntry[] } | null = null;

async function loadCatalog(): Promise<KevEntry[]> {
  // Cache for 1 hour (catalog updates roughly daily).
  if (cache && Date.now() - cache.fetchedAt < 60 * 60 * 1000) return cache.entries;
  const res = await fetch(KEV_URL, { headers: { "User-Agent": "SupplyChainSentinelAI/1.0" } });
  if (!res.ok) throw new Error(`CISA KEV ${res.status}`);
  const data = (await res.json()) as KevCatalog;
  cache = { fetchedAt: Date.now(), entries: data.vulnerabilities ?? [] };
  return cache.entries;
}

/** Return real KEV entries whose vendor/product matches any supplier keyword. */
export async function fetchKevForKeywords(keywords: string[]): Promise<CVE[]> {
  const entries = await loadCatalog();
  const needles = keywords.map((k) => k.toLowerCase());
  const out: CVE[] = [];
  const seen = new Set<string>();

  for (const e of entries) {
    const hay = `${e.vendorProject} ${e.product} ${e.vulnerabilityName}`.toLowerCase();
    const matched = needles.find((n) => hay.includes(n));
    if (!matched) continue;
    if (seen.has(e.cveID)) continue;
    seen.add(e.cveID);
    out.push({
      id: e.cveID,
      cvss: 9.0, // KEV entries are actively exploited; treat as critical severity.
      severity: "CRITICAL",
      description: e.shortDescription,
      published: e.dateAdded,
      source: "CISA-KEV",
      vendor: e.vendorProject,
      product: e.product,
      known_exploited: true,
      url: `https://nvd.nist.gov/vuln/detail/${e.cveID}`,
    });
  }
  return out;
}

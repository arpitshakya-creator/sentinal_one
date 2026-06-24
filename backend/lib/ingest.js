import { getDb } from "./db.js";
import { fetchCvesForKeyword, delay } from "./nvd.js";
import { fetchKevForKeywords } from "./cisa.js";
import { recomputeAllRiskScores } from "./risk.js";

async function getSuppliers() {
  const db = await getDb();
  const res = await db.query("SELECT id, label, props FROM nodes WHERE type = 'Supplier'");
  return res.rows;
}

async function upsertCve(cve) {
  const db = await getDb();
  await db.query(
    `INSERT INTO cves (id, cvss, severity, description, published, source, vendor, product, known_exploited, url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET
       cvss = max(cves.cvss, excluded.cvss),
       known_exploited = (cves.known_exploited OR excluded.known_exploited),
       severity = excluded.severity,
       description = excluded.description`,
    [
      cve.id,
      cve.cvss,
      cve.severity,
      cve.description,
      cve.published,
      cve.source,
      cve.vendor,
      cve.product,
      cve.known_exploited,
      cve.url,
    ]
  );
}

async function linkCve(nodeId, cveId, keyword) {
  const db = await getDb();
  await db.query(
    `INSERT INTO node_cves (node_id, cve_id, matched_keyword) VALUES ($1,$2,$3)
     ON CONFLICT (node_id, cve_id) DO UPDATE SET matched_keyword = excluded.matched_keyword`,
    [nodeId, cveId, keyword]
  );
}

async function emitThreatEvent(supplierId, cve) {
  const db = await getDb();
  const eventId = `evt_kev_${supplierId}_${cve.id}`;
  await db.query(
    `INSERT INTO threat_events (event_id, source, supplier_id, type, severity, timestamp, description, linked_cves)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (event_id) DO NOTHING`,
    [
      eventId,
      "CISA-KEV",
      supplierId,
      "known_exploited_vulnerability",
      "critical",
      new Date().toISOString(),
      `Actively exploited vulnerability ${cve.id} affects ${cve.vendor ?? "supplier technology"} (${cve.product ?? "multiple products"}).`,
      JSON.stringify([cve.id]),
    ]
  );
}

/**
 * Pull live CVE intelligence for every supplier from NVD + CISA KEV, store it
 * in the database, link CVEs to suppliers, and recompute all risk scores.
 */
export async function runIngest(opts = {}) {
  const suppliers = await getSuppliers();
  const hasKey = !!process.env.NVD_API_KEY;
  const throttleMs = opts.throttleMs ?? (hasKey ? 800 : 6500);

  const result = {
    suppliers_scanned: suppliers.length,
    nvd_cves: 0,
    kev_cves: 0,
    links_created: 0,
    threat_events: 0,
    errors: [],
  };

  // De-duplicate keyword lookups across suppliers to respect NVD rate limits.
  const keywordToSuppliers = new Map();
  for (const s of suppliers) {
    for (const kw of s.props.keywords ?? []) {
      const list = keywordToSuppliers.get(kw) ?? [];
      list.push(s.id);
      keywordToSuppliers.set(kw, list);
    }
  }

  // 1) CISA KEV — single catalog fetch, matched against all keywords.
  try {
    const allKeywords = Array.from(keywordToSuppliers.keys());
    const kev = await fetchKevForKeywords(allKeywords);
    for (const cve of kev) {
      await upsertCve(cve);
      result.kev_cves++;
      const hay = `${cve.vendor ?? ""} ${cve.product ?? ""}`.toLowerCase();
      for (const [kw, supplierIds] of keywordToSuppliers) {
        if (!hay.includes(kw.toLowerCase())) continue;
        for (const sid of supplierIds) {
          await linkCve(sid, cve.id, kw);
          result.links_created++;
          await emitThreatEvent(sid, cve);
          result.threat_events++;
        }
      }
    }
  } catch (e) {
    result.errors.push(`CISA KEV: ${e.message}`);
  }

  // 2) NVD — one throttled request per unique keyword.
  const keywords = Array.from(keywordToSuppliers.keys());
  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    try {
      const cves = await fetchCvesForKeyword(kw);
      for (const cve of cves) {
        await upsertCve(cve);
        result.nvd_cves++;
        for (const sid of keywordToSuppliers.get(kw) ?? []) {
          await linkCve(sid, cve.id, kw);
          result.links_created++;
        }
      }
    } catch (e) {
      result.errors.push(`NVD "${kw}": ${e.message}`);
    }
    if (i < keywords.length - 1) await delay(throttleMs);
  }

  await recomputeAllRiskScores();
  return result;
}

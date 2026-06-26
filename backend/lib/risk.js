import { getDb } from "./db.js";
import { loadGraph, reachableByType } from "./graph.js";
import { cvssV31Severity, iso27005Assessment } from "./standards.js";

function withStandards(profile) {
  return {
    ...profile,
    cvss_severity: cvssV31Severity(profile.max_cvss),
    iso27005: iso27005Assessment({
      breach_indicator: profile.breach_indicator,
      max_cvss: profile.max_cvss,
      patch_lag_days: profile.patch_lag_days,
      connected_plant_count: profile.connected_plant_count,
      risk_score: profile.risk_score,
    }),
  };
}

// Risk Score = (0.40 x maxCVSS-band) + (0.30 x breach) + (0.20 x patchLag) + (0.10 x connectivity)
// Each factor is normalized to the band ranges from the design doc so the
// composite score lands on a 0-100 scale.
const W = { cve: 40, breach: 30, patchLag: 20, connectivity: 10 };

export function bandFor(score) {
  if (score >= 70) return "critical";
  if (score >= 40) return "medium";
  return "low";
}

function daysSince(iso) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

async function gatherInputs() {
  const db = await getDb();
  const graph = await loadGraph();

  const suppliers = await db.query("SELECT id, label, props FROM nodes WHERE type = 'Supplier'");

  const out = [];
  for (const s of suppliers.rows) {
    const cveRes = await db.query(
      `SELECT c.id, c.cvss, c.known_exploited, c.published
       FROM node_cves nc JOIN cves c ON c.id = nc.cve_id
       WHERE nc.node_id = $1
       ORDER BY c.cvss DESC`,
      [s.id]
    );

    const cves = cveRes.rows;
    const maxCvss = cves.length ? Math.max(...cves.map((c) => Number(c.cvss))) : 0;
    const breach = cves.some((c) => c.known_exploited);
    // Patch lag proxy: age (days) of the most-severe known vulnerability.
    const topCve = cves[0];
    const patchLag = topCve ? Math.min(daysSince(topCve.published), 20) : 0;
    const plants = reachableByType(graph, s.id, "Plant").length;

    out.push({
      id: s.id,
      label: s.label,
      tier: Number(s.props.tier ?? 0),
      country: String(s.props.country ?? ""),
      base_risk: Number(s.props.base_risk ?? 0),
      max_cvss: maxCvss,
      breach_indicator: breach,
      patch_lag_days: patchLag,
      connected_plant_count: plants,
      open_cves: cves.map((c) => c.id),
    });
  }
  return out;
}

function scoreFor(i) {
  const cve = (i.max_cvss / 10) * W.cve;
  const breach = i.breach_indicator ? W.breach : 0;
  const patch = (Math.min(i.patch_lag_days, 20) / 20) * W.patchLag;
  const conn = Math.min(i.connected_plant_count, 10) * (W.connectivity / 10);
  // Baseline operational risk acts as a floor when no live threat signal exists.
  const computed = cve + breach + patch + conn;
  return Math.min(100, Math.round(Math.max(computed, i.base_risk)));
}

export async function recomputeAllRiskScores() {
  const db = await getDb();
  const inputs = await gatherInputs();
  const profiles = [];

  for (const i of inputs) {
    const score = scoreFor(i);

    const prev = await db.query(
      "SELECT score FROM risk_history WHERE supplier_id = $1 ORDER BY ts DESC LIMIT 1",
      [i.id]
    );
    const previousScore = prev.rows.length ? Number(prev.rows[0].score) : i.base_risk;
    const delta = Math.round((score - previousScore) * 10) / 10;

    const cur = await db.query("SELECT props FROM nodes WHERE id = $1", [i.id]);
    const mergedProps = {
      ...(cur.rows[0]?.props ?? {}),
      risk_score: score,
      risk_delta: delta,
      risk_band: bandFor(score),
      risk_summary: buildSummary(i, score, delta),
      open_cves: i.open_cves,
      max_cvss: i.max_cvss,
      breach_indicator: i.breach_indicator,
      patch_lag_days: i.patch_lag_days,
      connected_plant_count: i.connected_plant_count,
    };
    await db.query("UPDATE nodes SET props = $2 WHERE id = $1", [
      i.id,
      JSON.stringify(mergedProps),
    ]);
    await db.query("INSERT INTO risk_history (supplier_id, score, delta) VALUES ($1,$2,$3)", [
      i.id,
      score,
      delta,
    ]);

    profiles.push(
      withStandards({
        supplier_id: i.id,
        name: i.label,
        tier: i.tier,
        country: i.country,
        risk_score: score,
        risk_delta: delta,
        band: bandFor(score),
        max_cvss: i.max_cvss,
        breach_indicator: i.breach_indicator,
        patch_lag_days: i.patch_lag_days,
        connected_plant_count: i.connected_plant_count,
        open_cve_count: i.open_cves.length,
        open_cves: i.open_cves,
        summary: buildSummary(i, score, delta),
      })
    );
  }

  profiles.sort((a, b) => b.risk_score - a.risk_score);
  return profiles;
}

function buildSummary(i, score, delta) {
  const band = bandFor(score);
  const deltaText = delta > 0 ? `up ${delta}` : delta < 0 ? `down ${Math.abs(delta)}` : "unchanged";
  if (i.open_cves.length === 0) {
    return `${i.label} (Tier ${i.tier}, ${i.country}) shows no live CVE exposure; baseline operational risk ${score} (${band}).`;
  }
  const exploited = i.breach_indicator ? " including an actively exploited (CISA KEV) vulnerability" : "";
  return `${i.label} has ${i.open_cves.length} open CVE(s) with max CVSS ${i.max_cvss.toFixed(1)}${exploited}. Risk ${score}/100 (${band}, ${deltaText}); ${i.connected_plant_count} downstream plant(s) exposed.`;
}

export async function getRiskProfiles() {
  const db = await getDb();
  const res = await db.query("SELECT id, label, props FROM nodes WHERE type = 'Supplier'");
  const profiles = res.rows.map((s) => {
    const p = s.props;
    const score = Number(p.risk_score ?? p.base_risk ?? 0);
    const openCves = p.open_cves ?? [];
    return withStandards({
      supplier_id: s.id,
      name: s.label,
      tier: Number(p.tier ?? 0),
      country: String(p.country ?? ""),
      risk_score: score,
      risk_delta: Number(p.risk_delta ?? 0),
      band: bandFor(score),
      max_cvss: Number(p.max_cvss ?? 0),
      breach_indicator: Boolean(p.breach_indicator ?? false),
      patch_lag_days: Number(p.patch_lag_days ?? 0),
      connected_plant_count: Number(p.connected_plant_count ?? 0),
      open_cve_count: openCves.length,
      open_cves: openCves,
      summary:
        p.risk_summary ??
        `${s.label} — risk ${score}/100 (${bandFor(score)}), ${openCves.length} open CVE(s).`,
    });
  });
  profiles.sort((a, b) => b.risk_score - a.risk_score);
  return profiles;
}

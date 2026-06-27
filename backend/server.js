import "./lib/env.js";
import express from "express";
import cors from "cors";

import { getDb } from "./lib/db.js";
import { loadGraph } from "./lib/graph.js";
import { getRiskProfiles } from "./lib/risk.js";
import { assessImpact } from "./lib/impact.js";
import { buildMitigationPlan } from "./lib/mitigation.js";
import { runIngest } from "./lib/ingest.js";
import { aiImpactSummary, aiMitigationSummary, isAiEnabled } from "./lib/ai.js";
import {
  STANDARDS,
  CONTROL_LIBRARY,
  cvssV31Severity,
  supplierComplianceFindings,
  simulationStandardsAnalysis,
  complianceChecklist,
} from "./lib/standards.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

// Async route wrapper so thrown errors become 500s instead of crashing.
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => {
  console.error(e);
  res.status(500).json({ error: e.message });
});

function inferSupplierFromQuery(query, suppliers) {
  const q = query.toLowerCase();
  return suppliers.find((s) => q.includes(s.name.toLowerCase().split(" ")[0]));
}

// --- Suppliers ---
app.get("/api/suppliers", wrap(async (_req, res) => {
  const profiles = await getRiskProfiles();
  res.json({ suppliers: profiles });
}));

// --- Graph ---
app.get("/api/graph", wrap(async (_req, res) => {
  const graph = await loadGraph();
  res.json({ nodes: Array.from(graph.nodes.values()), edges: graph.edges });
}));

// --- Impact simulation ---
app.post("/api/simulate", wrap(async (req, res) => {
  const body = req.body ?? {};
  let supplierId = body.supplier_id;
  const scenario = body.scenario || "ransomware";
  const query = body.query || "";
  const selectedStandards = Array.isArray(body.standards) ? body.standards : [];

  // Allow natural-language entry: resolve supplier from the query text.
  if (!supplierId && query) {
    const profiles = await getRiskProfiles();
    const match = inferSupplierFromQuery(
      query,
      profiles.map((p) => ({ id: p.supplier_id, name: p.name }))
    );
    supplierId = match?.id;
  }

  if (!supplierId) {
    return res.status(400).json({
      error: "Could not resolve a supplier. Provide supplier_id or name the supplier in your query.",
    });
  }

  try {
    const impact = await assessImpact(supplierId, scenario);

    // Standards-lensed analysis for the selected frameworks.
    const profiles = await getRiskProfiles();
    const profile = profiles.find((p) => p.supplier_id === supplierId) ?? {};
    const db = await getDb();
    const propsRow = await db.query("SELECT props FROM nodes WHERE id = $1", [supplierId]);
    const props = propsRow.rows[0]?.props ?? {};
    const cveRows = await db.query(
      `SELECT c.id, c.cvss, c.known_exploited
       FROM node_cves nc JOIN cves c ON c.id = nc.cve_id
       WHERE nc.node_id = $1 ORDER BY c.cvss DESC`,
      [supplierId]
    );
    const stdCtx = { profile, props, impact, cves: cveRows.rows };
    impact.standards_analysis = simulationStandardsAnalysis(selectedStandards, stdCtx);
    impact.compliance_checklist = complianceChecklist(selectedStandards, stdCtx);
    impact.standards_selected = selectedStandards;

    const summary = await aiImpactSummary(
      impact,
      query || `What happens if ${impact.supplier_name} is hit by ${scenario}?`
    );
    if (summary) impact.ai_summary = summary;
    res.json({ impact, ai_enabled: !!summary });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

// --- Mitigation plan ---
app.post("/api/mitigate", wrap(async (req, res) => {
  const body = req.body ?? {};
  const supplierId = body.supplier_id;
  if (!supplierId) {
    return res.status(400).json({ error: "supplier_id is required" });
  }

  try {
    const impact =
      body.impact_assessment ?? (await assessImpact(supplierId, body.scenario || "ransomware"));
    const plan = await buildMitigationPlan(supplierId, impact);
    const summary = await aiMitigationSummary(plan);
    if (summary) plan.ai_summary = summary;
    res.json({ plan, impact, ai_enabled: !!summary });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

// --- CVEs ---
app.get("/api/cves", wrap(async (req, res) => {
  const db = await getDb();
  const supplier = req.query.supplier;

  // Attach the CVSS v3.1 qualitative severity rating to each row.
  const withSeverity = (rows) =>
    rows.map((r) => ({ ...r, cvss_severity: cvssV31Severity(r.cvss) }));

  if (supplier) {
    const result = await db.query(
      `SELECT c.*, nc.matched_keyword
       FROM node_cves nc JOIN cves c ON c.id = nc.cve_id
       WHERE nc.node_id = $1 ORDER BY c.cvss DESC`,
      [supplier]
    );
    return res.json({ cves: withSeverity(result.rows) });
  }

  const result = await db.query(
    `SELECT * FROM cves ORDER BY known_exploited DESC, cvss DESC, ingested_at DESC LIMIT 100`
  );
  res.json({ cves: withSeverity(result.rows) });
}));

// --- Standards & frameworks catalog ---
app.get("/api/standards", (_req, res) => {
  res.json({ standards: STANDARDS, control_library: CONTROL_LIBRARY });
});

// --- Per-supplier compliance posture (ISO/IEC 27002 + NIST SP 800-53) ---
app.get("/api/compliance", wrap(async (req, res) => {
  const supplierId = req.query.supplier;
  const profiles = await getRiskProfiles();
  const targets = supplierId
    ? profiles.filter((p) => p.supplier_id === supplierId)
    : profiles;

  const db = await getDb();
  const suppliers = await Promise.all(
    targets.map(async (profile) => {
      const row = await db.query("SELECT props FROM nodes WHERE id = $1", [profile.supplier_id]);
      const props = row.rows[0]?.props ?? {};
      const { findings, summary } = supplierComplianceFindings(profile, props);
      return {
        supplier_id: profile.supplier_id,
        name: profile.name,
        band: profile.band,
        risk_score: profile.risk_score,
        iso27005: profile.iso27005,
        findings,
        summary,
      };
    })
  );
  res.json({ standards: STANDARDS.map((s) => s.name), suppliers });
}));

// --- Threat events ---
app.get("/api/threats", wrap(async (_req, res) => {
  const db = await getDb();
  const result = await db.query(
    `SELECT te.*, n.label AS supplier_name
     FROM threat_events te LEFT JOIN nodes n ON n.id = te.supplier_id
     ORDER BY te.timestamp DESC LIMIT 50`
  );
  res.json({ threats: result.rows });
}));

// --- Live CVE ingestion (NVD + CISA KEV) ---
app.post("/api/ingest", wrap(async (_req, res) => {
  try {
    const result = await runIngest();
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}));

// --- Platform status ---
app.get("/api/status", wrap(async (_req, res) => {
  const db = await getDb();
  const cves = await db.query("SELECT count(*) AS count FROM cves");
  const kev = await db.query("SELECT count(*) AS count FROM cves WHERE known_exploited = 1");
  const threats = await db.query("SELECT count(*) AS count FROM threat_events");
  const lastIngest = await db.query("SELECT max(ingested_at) AS ts FROM cves");

  res.json({
    ai_enabled: isAiEnabled(),
    cve_count: Number(cves.rows[0]?.count ?? 0),
    kev_count: Number(kev.rows[0]?.count ?? 0),
    threat_count: Number(threats.rows[0]?.count ?? 0),
    last_ingest: lastIngest.rows[0]?.ts ?? null,
  });
}));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Initialize the database (and seed) before accepting traffic.
getDb()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`SupplyChain Sentinel API listening on http://localhost:${PORT}`);
      console.log(`AI enabled: ${isAiEnabled()}`);
    });
    server.on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Another server (or a previous run) is still running.\n` +
            `Stop it first, or set a different PORT in backend/.env.local.`
        );
      } else {
        console.error("Server error:", e);
      }
      process.exit(1);
    });
  })
  .catch((e) => {
    console.error("Failed to initialize database:", e);
    process.exit(1);
  });

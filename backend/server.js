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

  if (supplier) {
    const result = await db.query(
      `SELECT c.*, nc.matched_keyword
       FROM node_cves nc JOIN cves c ON c.id = nc.cve_id
       WHERE nc.node_id = $1 ORDER BY c.cvss DESC`,
      [supplier]
    );
    return res.json({ cves: result.rows });
  }

  const result = await db.query(
    `SELECT * FROM cves ORDER BY known_exploited DESC, cvss DESC, ingested_at DESC LIMIT 100`
  );
  res.json({ cves: result.rows });
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

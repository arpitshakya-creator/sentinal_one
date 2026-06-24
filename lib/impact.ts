import { getDb } from "./db";
import { loadGraph, bfsBlastRadius, type LoadedGraph } from "./graph";
import type { ImpactAssessment, Confidence, GraphNode } from "./types";

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

interface ComponentImpact {
  componentId: string;
  label: string;
  criticality: string;
  safetyStock: number;
  replacementLeadTime: number;
  hasAlternate: boolean;
}

function componentsProvidedBy(graph: LoadedGraph, supplierId: string): GraphNode[] {
  const out: GraphNode[] = [];
  for (const e of graph.adjacency.get(supplierId) ?? []) {
    if (e.type !== "PROVIDES") continue;
    const node = graph.nodes.get(e.target);
    if (node) out.push(node);
  }
  return out;
}

function alternateLeadTime(
  graph: LoadedGraph,
  componentId: string,
  excludeSupplierId: string,
  fallbackLead: number
): { lead: number; hasAlternate: boolean } {
  let best: number | null = null;
  for (const [src, edges] of graph.adjacency) {
    if (src === excludeSupplierId) continue;
    for (const e of edges) {
      if (e.type === "PROVIDES" && e.target === componentId) {
        const lt = Number(e.props.lead_time_days ?? graph.nodes.get(src)?.props.lead_time_days ?? 0);
        if (lt > 0 && (best === null || lt < best)) best = lt;
      }
    }
  }
  if (best === null) return { lead: fallbackLead + 7, hasAlternate: false };
  return { lead: best, hasAlternate: true };
}

export async function assessImpact(
  supplierId: string,
  scenario = "ransomware"
): Promise<ImpactAssessment> {
  const db = await getDb();
  const graph = await loadGraph();
  const supplier = graph.nodes.get(supplierId);
  if (!supplier || supplier.type !== "Supplier") {
    throw new Error(`Supplier not found: ${supplierId}`);
  }

  const riskScore = Number(supplier.props.risk_score ?? supplier.props.base_risk ?? 50);
  const blast = bfsBlastRadius(graph, supplierId, Math.max(riskScore, 50));

  const plants = blast.filter((b) => b.type === "Plant");
  const products = blast.filter((b) => b.type === "Product");

  // Determine critical products: products reachable through a critical-path edge.
  const criticalProductIds = new Set<string>();
  const components = componentsProvidedBy(graph, supplierId);
  const componentImpacts: ComponentImpact[] = [];

  for (const comp of components) {
    const supplierLead = Number(supplier.props.lead_time_days ?? 14);
    const alt = alternateLeadTime(graph, comp.id, supplierId, supplierLead);
    componentImpacts.push({
      componentId: comp.id,
      label: comp.label,
      criticality: String(comp.props.criticality ?? "medium"),
      safetyStock: Number(comp.props.safety_stock_days ?? 7),
      replacementLeadTime: alt.lead,
      hasAlternate: alt.hasAlternate,
    });
    for (const e of graph.adjacency.get(comp.id) ?? []) {
      if (e.type === "USED_IN" && e.props.is_critical_path) {
        criticalProductIds.add(e.target);
      }
    }
  }

  // Downtime: worst-case gap between replacement lead time and safety stock
  // across the critical components this supplier provides.
  let downtime = 0;
  for (const c of componentImpacts) {
    if (c.criticality === "critical" || c.criticality === "high") {
      const gap = Math.max(0, c.replacementLeadTime - c.safetyStock);
      // Sole-source components with no alternate take longer to recover.
      const adjusted = c.hasAlternate ? gap : gap + 3;
      downtime = Math.max(downtime, adjusted);
    }
  }
  if (downtime === 0 && componentImpacts.length > 0) downtime = 2;

  const criticalProducts = products
    .filter((p) => criticalProductIds.has(p.id))
    .map((p) => p.label);
  const criticalProductLabels =
    criticalProducts.length > 0 ? criticalProducts : products.map((p) => p.label);

  // Revenue at risk = daily revenue of affected critical products x downtime days.
  let dailyRevenue = 0;
  for (const p of products) {
    if (criticalProductIds.size === 0 || criticalProductIds.has(p.id)) {
      const node = graph.nodes.get(p.id);
      dailyRevenue += Number(node?.props.daily_revenue ?? 0);
    }
  }
  const revenueRaw = dailyRevenue * downtime;

  const linkedCvesRes = await db.query<{ id: string }>(
    `SELECT c.id FROM node_cves nc JOIN cves c ON c.id = nc.cve_id
     WHERE nc.node_id = $1 ORDER BY c.cvss DESC LIMIT 10`,
    [supplierId]
  );
  const linkedCves = linkedCvesRes.rows.map((r) => r.id);

  const breach = Boolean(supplier.props.breach_indicator);
  let confidence: Confidence = "medium";
  if (breach && linkedCves.length > 0) confidence = "high";
  else if (linkedCves.length === 0) confidence = "low";

  return {
    supplier_id: supplierId,
    supplier_name: supplier.label,
    scenario,
    affected_plants: plants.length,
    affected_plant_names: plants.map((p) => p.label),
    estimated_downtime_days: downtime,
    revenue_at_risk_usd: fmtUsd(revenueRaw),
    revenue_at_risk_raw: revenueRaw,
    critical_products: criticalProductLabels,
    linked_cves: linkedCves,
    blast_radius_nodes: blast.map((b) => b.id),
    blast_radius: blast,
    confidence,
    generated_at: new Date().toISOString(),
  };
}

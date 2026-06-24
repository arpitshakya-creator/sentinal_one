import { loadGraph } from "./graph.js";

// Region adjacency used for the geographic-proximity factor of the
// alternate-supplier similarity score.
const REGION_ADJACENCY = {
  "North America": { "North America": 1.0, Europe: 0.5, Asia: 0.3 },
  Europe: { Europe: 1.0, "North America": 0.5, Asia: 0.4 },
  Asia: { Asia: 1.0, Europe: 0.4, "North America": 0.3 },
};

function proximityScore(supplierRegion, plantRegions) {
  if (plantRegions.length === 0) return 0.5;
  const scores = plantRegions.map((pr) => REGION_ADJACENCY[supplierRegion]?.[pr] ?? 0.3);
  return Math.max(...scores);
}

function componentsOf(graph, supplierId) {
  const set = new Set();
  for (const e of graph.adjacency.get(supplierId) ?? []) {
    if (e.type === "PROVIDES") set.add(e.target);
  }
  return set;
}

function plantRegionsFromImpact(graph, impact) {
  const regions = new Set();
  for (const id of impact.blast_radius_nodes) {
    const node = graph.nodes.get(id);
    if (node?.type === "Plant" && node.props.region) regions.add(String(node.props.region));
  }
  return Array.from(regions);
}

function findAlternateSuppliers(graph, compromisedId, impact) {
  const compromised = graph.nodes.get(compromisedId);
  if (!compromised) return [];
  const targetComponents = componentsOf(graph, compromisedId);
  const targetCategories = new Set(compromised.props.component_categories ?? []);
  const plantRegions = plantRegionsFromImpact(graph, impact);

  const componentLabels = new Map();
  for (const cid of targetComponents) {
    const node = graph.nodes.get(cid);
    if (node) componentLabels.set(cid, node.label);
  }

  const candidates = [];
  for (const node of graph.nodes.values()) {
    if (node.type !== "Supplier" || node.id === compromisedId) continue;
    const theirComponents = componentsOf(graph, node.id);
    const covered = [...targetComponents].filter((c) => theirComponents.has(c));
    const theirCats = new Set(node.props.component_categories ?? []);
    const categoryOverlap = [...targetCategories].filter((c) => theirCats.has(c)).length;
    if (covered.length === 0 && categoryOverlap === 0) continue;

    // Similarity factors (weights from the design doc).
    const componentMatch =
      targetComponents.size > 0
        ? covered.length / targetComponents.size
        : categoryOverlap / Math.max(targetCategories.size, 1);
    const geo = proximityScore(String(node.props.region ?? ""), plantRegions);
    const quality = Number(node.props.quality_rating ?? 0.8);
    const capacity = Number(node.props.capacity_pct ?? 50) / 100;

    const similarity = componentMatch * 0.4 + geo * 0.25 + quality * 0.2 + capacity * 0.15;

    const leadTime = Number(node.props.lead_time_days ?? 14);
    const onboarding = similarity > 0.8 ? "low" : similarity > 0.6 ? "medium" : "high";

    candidates.push({
      supplier_id: node.id,
      name: node.label,
      country: String(node.props.country ?? ""),
      similarity_score: Math.round(similarity * 100),
      component_category_match: Math.round(componentMatch * 100),
      geographic_proximity: Math.round(geo * 100),
      quality_rating: Math.round(quality * 100),
      capacity_availability: Math.round(capacity * 100),
      estimated_lead_time_days: leadTime,
      onboarding_effort: onboarding,
      covers_components: covered.map((c) => componentLabels.get(c) ?? c),
    });
  }

  candidates.sort((a, b) => b.similarity_score - a.similarity_score);
  return candidates.slice(0, 5);
}

function buildActions(supplier, impact, alternates) {
  const erpConnected = Boolean(supplier.props.erp_connected);
  const topAlt = alternates[0];

  const immediate = [
    `Isolate all network connectivity between ${supplier.label} and Helios systems; terminate active VPN/EDI sessions.`,
    erpConnected
      ? `Revoke ${supplier.label}'s ERP integration credentials (SAP S/4HANA) and rotate shared keys immediately.`
      : `Block inbound data exchange from ${supplier.label} at the firewall and disable scheduled imports.`,
    `Apply emergency firewall rules to quarantine traffic at ${impact.affected_plant_names.join(", ") || "affected plants"}.`,
  ];
  if (impact.linked_cves.length) {
    immediate.push(
      `Hunt for indicators of compromise tied to ${impact.linked_cves.slice(0, 3).join(", ")} across connected OT/IT assets.`
    );
  }

  const shortTerm = [
    `Activate contingency safety stock for ${impact.critical_products.join(", ") || "affected products"} to cover the ${impact.estimated_downtime_days}-day exposure window.`,
    `Reroute logistics away from ${supplier.label}; notify plant operations directors at ${impact.affected_plant_names.join(", ") || "affected plants"}.`,
    `Open a P1 incident bridge and brief the CISO; revenue at risk is ${impact.revenue_at_risk_usd}.`,
  ];

  const mediumTerm = [
    topAlt
      ? `Fast-track qualification of ${topAlt.name} (${topAlt.similarity_score}% match, ${topAlt.estimated_lead_time_days}-day lead time) for ${topAlt.covers_components.join(", ") || "affected components"}.`
      : `Identify and qualify an alternate source for ${supplier.label}'s components.`,
    `Issue emergency purchase orders to redundant suppliers and confirm capacity commitments.`,
    `Run a forensic scope assessment with ${supplier.label} and require attestation of remediation.`,
  ];

  const longTerm = [
    `Conduct a full forensic audit and post-incident review of the ${supplier.label} breach vector.`,
    `Review and renegotiate contract risk clauses (SLAs, cyber attestations, audit rights) with ${supplier.label}.`,
    `Redesign network segmentation to enforce zero-trust between supplier integrations and OT/SCADA zones.`,
    `Reduce sole-source exposure by dual-sourcing critical components going forward.`,
  ];

  return [
    { category: "immediate", window: "0–6 hours", actions: immediate },
    { category: "short_term", window: "6–48 hours", actions: shortTerm },
    { category: "medium_term", window: "2–7 days", actions: mediumTerm },
    { category: "long_term", window: "1–4 weeks", actions: longTerm },
  ];
}

export async function buildMitigationPlan(supplierId, impact) {
  const graph = await loadGraph();
  const supplier = graph.nodes.get(supplierId);
  if (!supplier) throw new Error(`Supplier not found: ${supplierId}`);

  const alternates = findAlternateSuppliers(graph, supplierId, impact);
  const actions = buildActions(supplier, impact, alternates);

  return {
    supplier_id: supplierId,
    supplier_name: supplier.label,
    generated_at: new Date().toISOString(),
    actions,
    alternate_suppliers: alternates,
  };
}

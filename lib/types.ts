// Shared domain types for SupplyChain Sentinel AI.

export type NodeType =
  | "Manufacturer"
  | "Supplier"
  | "Component"
  | "Product"
  | "Plant"
  | "System";

export type EdgeType =
  | "SOURCES_FROM"
  | "PROVIDES"
  | "USED_IN"
  | "MANUFACTURED_AT"
  | "CONNECTS_TO";

export type RiskBand = "low" | "medium" | "critical";
export type Confidence = "low" | "medium" | "high";

export interface GraphNodeProps {
  // Supplier
  tier?: number;
  country?: string;
  region?: string;
  keywords?: string[]; // real vendor/product keywords used for live CVE matching
  products?: string[];
  erp_connected?: boolean;
  last_audit_date?: string;
  quality_rating?: number; // 0-1
  capacity_pct?: number; // 0-100 available capacity
  lead_time_days?: number;
  is_redundant?: boolean;
  component_categories?: string[];
  base_risk?: number; // baseline operational risk before live threat data
  // Component
  part_number?: string;
  criticality?: "low" | "medium" | "high" | "critical";
  category?: string;
  safety_stock_days?: number;
  // Product
  sku?: string;
  daily_revenue?: number;
  // Plant
  location?: string;
  erp_system?: string;
  // System
  version?: string;
  last_patched?: string;
  system_type?: string;
  // Manufacturer
  revenue?: number;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  props: GraphNodeProps;
}

export interface EdgeProps {
  spend?: number;
  is_sole_source?: boolean;
  contract_end?: string;
  volume_per_month?: number;
  lead_time_days?: number;
  quantity?: number;
  is_critical_path?: boolean;
  primary?: boolean;
  capacity_pct?: number;
  protocol?: string;
  auth_method?: string;
  encrypted?: boolean;
  weight?: number;
  [key: string]: unknown;
}

export interface GraphEdge {
  id?: number;
  source: string;
  target: string;
  type: EdgeType;
  props: EdgeProps;
}

export interface CVE {
  id: string;
  cvss: number;
  severity: string;
  description: string;
  published: string;
  source: "NVD" | "CISA-KEV";
  vendor: string | null;
  product: string | null;
  known_exploited: boolean;
  url: string;
}

export interface ThreatEvent {
  event_id: string;
  source: string;
  supplier_id: string;
  type: string;
  severity: RiskBand;
  timestamp: string;
  description: string;
  linked_cves: string[];
}

export interface RiskProfile {
  supplier_id: string;
  name: string;
  tier: number;
  country: string;
  risk_score: number;
  risk_delta: number;
  band: RiskBand;
  max_cvss: number;
  breach_indicator: boolean;
  patch_lag_days: number;
  connected_plant_count: number;
  open_cve_count: number;
  open_cves: string[];
  summary: string;
}

export interface BlastNode {
  id: string;
  type: NodeType;
  label: string;
  hop: number;
  propagated_risk: number;
}

export interface ImpactAssessment {
  supplier_id: string;
  supplier_name: string;
  scenario: string;
  affected_plants: number;
  affected_plant_names: string[];
  estimated_downtime_days: number;
  revenue_at_risk_usd: string;
  revenue_at_risk_raw: number;
  critical_products: string[];
  linked_cves: string[];
  blast_radius_nodes: string[];
  blast_radius: BlastNode[];
  confidence: Confidence;
  generated_at: string;
  ai_summary?: string;
}

export interface AlternateSupplier {
  supplier_id: string;
  name: string;
  country: string;
  similarity_score: number;
  component_category_match: number;
  geographic_proximity: number;
  quality_rating: number;
  capacity_availability: number;
  estimated_lead_time_days: number;
  onboarding_effort: "low" | "medium" | "high";
  covers_components: string[];
}

export interface MitigationAction {
  category: "immediate" | "short_term" | "medium_term" | "long_term";
  window: string;
  actions: string[];
}

export interface MitigationPlan {
  supplier_id: string;
  supplier_name: string;
  generated_at: string;
  actions: MitigationAction[];
  alternate_suppliers: AlternateSupplier[];
  ai_summary?: string;
}

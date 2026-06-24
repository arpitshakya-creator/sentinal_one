import type { GraphNode, GraphEdge } from "./types";

// ---------------------------------------------------------------------------
// Realistic supply-chain dataset for "Helios Motorworks", a global manufacturer
// of EV traction motors and industrial drives.
//
// The organizational graph (suppliers, plants, products) is a realistic
// synthetic model of a multi-tier manufacturer. Crucially, every supplier's
// `keywords` map to REAL industrial-technology vendors (Siemens, Schneider,
// Moxa, Rockwell, etc.). Those keywords drive LIVE CVE matching against the
// NIST NVD API and CISA KEV catalog, so the threat data flowing through the
// platform is genuine, current vulnerability intelligence — not mock data.
// ---------------------------------------------------------------------------

export const MANUFACTURER_ID = "mfg_helios";

export const nodes: GraphNode[] = [
  {
    id: MANUFACTURER_ID,
    type: "Manufacturer",
    label: "Helios Motorworks",
    props: { revenue: 4_200_000_000, country: "United States", region: "North America" },
  },

  // ---- Plants ----
  {
    id: "plant_austin",
    type: "Plant",
    label: "Austin Gigafactory",
    props: { location: "Austin, TX, USA", region: "North America", erp_system: "SAP S/4HANA" },
  },
  {
    id: "plant_munich",
    type: "Plant",
    label: "Munich Drive Works",
    props: { location: "Munich, Germany", region: "Europe", erp_system: "SAP S/4HANA" },
  },
  {
    id: "plant_pune",
    type: "Plant",
    label: "Pune Assembly",
    props: { location: "Pune, India", region: "Asia", erp_system: "Oracle SCM Cloud" },
  },
  {
    id: "plant_guadalajara",
    type: "Plant",
    label: "Guadalajara Plant",
    props: { location: "Guadalajara, Mexico", region: "North America", erp_system: "Microsoft Dynamics 365" },
  },

  // ---- Products (finished goods) ----
  {
    id: "prod_hx9",
    type: "Product",
    label: "Helios HX-9 Traction Motor",
    props: { sku: "HX9-TRC", daily_revenue: 920_000 },
  },
  {
    id: "prod_eaxle",
    type: "Product",
    label: "eAxle Integrated Module",
    props: { sku: "EAX-INT", daily_revenue: 1_250_000 },
  },
  {
    id: "prod_drivecore",
    type: "Product",
    label: "DriveCore R5 Industrial Drive",
    props: { sku: "DCR5-IND", daily_revenue: 540_000 },
  },
  {
    id: "prod_bms",
    type: "Product",
    label: "Sentinel BMS Pack",
    props: { sku: "SBM-PCK", daily_revenue: 380_000 },
  },

  // ---- Components ----
  {
    id: "comp_servo",
    type: "Component",
    label: "Servo Motor Assembly",
    props: { part_number: "SRV-A210", criticality: "critical", category: "actuation", safety_stock_days: 4 },
  },
  {
    id: "comp_controller",
    type: "Component",
    label: "Motor Controller Board",
    props: { part_number: "CTL-C455", criticality: "critical", category: "control_electronics", safety_stock_days: 3 },
  },
  {
    id: "comp_plc",
    type: "Component",
    label: "PLC Control Unit",
    props: { part_number: "PLC-9000", criticality: "high", category: "control_electronics", safety_stock_days: 6 },
  },
  {
    id: "comp_power_module",
    type: "Component",
    label: "IGBT Power Module",
    props: { part_number: "PWR-IGBT7", criticality: "critical", category: "power_electronics", safety_stock_days: 5 },
  },
  {
    id: "comp_battery_cell",
    type: "Component",
    label: "Li-ion Battery Cell",
    props: { part_number: "BAT-21700", criticality: "critical", category: "energy_storage", safety_stock_days: 10 },
  },
  {
    id: "comp_wiring",
    type: "Component",
    label: "HV Wiring Harness",
    props: { part_number: "HVW-330", criticality: "medium", category: "interconnect", safety_stock_days: 12 },
  },
  {
    id: "comp_sensor",
    type: "Component",
    label: "Position Sensor Array",
    props: { part_number: "SNS-PA12", criticality: "high", category: "sensing", safety_stock_days: 8 },
  },
  {
    id: "comp_bearing",
    type: "Component",
    label: "Precision Bearings",
    props: { part_number: "BRG-X9", criticality: "medium", category: "mechanical", safety_stock_days: 20 },
  },

  // ---- Suppliers (keywords map to REAL vendors for live CVE matching) ----
  {
    id: "sup_roboflex",
    type: "Supplier",
    label: "RoboFlex Systems",
    props: {
      tier: 3, country: "Vietnam", region: "Asia",
      keywords: ["Moxa", "Advantech"],
      products: ["Servo Motor Assembly", "Motor Controller Board"],
      erp_connected: true, last_audit_date: "2025-09-15",
      quality_rating: 0.82, capacity_pct: 35, lead_time_days: 18,
      is_redundant: false, component_categories: ["actuation", "control_electronics"],
      base_risk: 18,
    },
  },
  {
    id: "sup_servotech",
    type: "Supplier",
    label: "ServoTech GmbH",
    props: {
      tier: 2, country: "Germany", region: "Europe",
      keywords: ["Siemens"],
      products: ["Servo Motor Assembly"],
      erp_connected: true, last_audit_date: "2026-02-20",
      quality_rating: 0.95, capacity_pct: 70, lead_time_days: 9,
      is_redundant: true, component_categories: ["actuation"],
      base_risk: 8,
    },
  },
  {
    id: "sup_flexsys",
    type: "Supplier",
    label: "FlexSys Controls",
    props: {
      tier: 2, country: "France", region: "Europe",
      keywords: ["Schneider Electric"],
      products: ["Motor Controller Board", "PLC Control Unit"],
      erp_connected: true, last_audit_date: "2025-11-30",
      quality_rating: 0.88, capacity_pct: 55, lead_time_days: 12,
      is_redundant: true, component_categories: ["control_electronics"],
      base_risk: 12,
    },
  },
  {
    id: "sup_nanocomp",
    type: "Supplier",
    label: "NanoComp Semiconductors",
    props: {
      tier: 4, country: "Taiwan", region: "Asia",
      keywords: ["Delta Electronics"],
      products: ["IGBT Power Module"],
      erp_connected: false, last_audit_date: "2025-07-01",
      quality_rating: 0.90, capacity_pct: 40, lead_time_days: 22,
      is_redundant: false, component_categories: ["power_electronics"],
      base_risk: 15,
    },
  },
  {
    id: "sup_nordicdrive",
    type: "Supplier",
    label: "Nordic Drive Co",
    props: {
      tier: 2, country: "Sweden", region: "Europe",
      keywords: ["ABB"],
      products: ["IGBT Power Module"],
      erp_connected: true, last_audit_date: "2026-01-10",
      quality_rating: 0.93, capacity_pct: 60, lead_time_days: 14,
      is_redundant: true, component_categories: ["power_electronics"],
      base_risk: 9,
    },
  },
  {
    id: "sup_voltcore",
    type: "Supplier",
    label: "VoltCore Energy",
    props: {
      tier: 1, country: "South Korea", region: "Asia",
      keywords: ["LG Energy", "Hitachi Energy"],
      products: ["Li-ion Battery Cell"],
      erp_connected: true, last_audit_date: "2026-03-05",
      quality_rating: 0.91, capacity_pct: 50, lead_time_days: 16,
      is_redundant: false, component_categories: ["energy_storage"],
      base_risk: 11,
    },
  },
  {
    id: "sup_precision",
    type: "Supplier",
    label: "Precision Dynamics",
    props: {
      tier: 2, country: "Japan", region: "Asia",
      keywords: ["Mitsubishi Electric"],
      products: ["Precision Bearings", "Position Sensor Array"],
      erp_connected: true, last_audit_date: "2025-12-12",
      quality_rating: 0.94, capacity_pct: 65, lead_time_days: 11,
      is_redundant: true, component_categories: ["mechanical", "sensing"],
      base_risk: 10,
    },
  },
  {
    id: "sup_wirewerks",
    type: "Supplier",
    label: "WireWerks Industrial",
    props: {
      tier: 3, country: "Mexico", region: "North America",
      keywords: ["Phoenix Contact"],
      products: ["HV Wiring Harness"],
      erp_connected: false, last_audit_date: "2025-10-22",
      quality_rating: 0.86, capacity_pct: 75, lead_time_days: 8,
      is_redundant: true, component_categories: ["interconnect"],
      base_risk: 13,
    },
  },
  {
    id: "sup_pacrim",
    type: "Supplier",
    label: "PacRim Automation",
    props: {
      tier: 2, country: "Singapore", region: "Asia",
      keywords: ["Omron"],
      products: ["PLC Control Unit"],
      erp_connected: true, last_audit_date: "2026-02-01",
      quality_rating: 0.89, capacity_pct: 58, lead_time_days: 13,
      is_redundant: true, component_categories: ["control_electronics"],
      base_risk: 10,
    },
  },
  {
    id: "sup_northstar",
    type: "Supplier",
    label: "NorthStar Controls",
    props: {
      tier: 1, country: "United States", region: "North America",
      keywords: ["Rockwell Automation"],
      products: ["Motor Controller Board"],
      erp_connected: true, last_audit_date: "2026-03-18",
      quality_rating: 0.92, capacity_pct: 62, lead_time_days: 10,
      is_redundant: true, component_categories: ["control_electronics"],
      base_risk: 9,
    },
  },
  {
    id: "sup_iolink",
    type: "Supplier",
    label: "IOLink Partners",
    props: {
      tier: 3, country: "Poland", region: "Europe",
      keywords: ["WAGO"],
      products: ["Position Sensor Array"],
      erp_connected: false, last_audit_date: "2025-08-19",
      quality_rating: 0.84, capacity_pct: 80, lead_time_days: 9,
      is_redundant: true, component_categories: ["sensing"],
      base_risk: 14,
    },
  },

  // ---- Systems (ERP / MES / SCADA / Logistics) ----
  {
    id: "sys_sap_austin",
    type: "System",
    label: "SAP S/4HANA (Austin)",
    props: { system_type: "ERP", version: "2023 FPS02", last_patched: "2026-04-12" },
  },
  {
    id: "sys_scada_austin",
    type: "System",
    label: "Siemens SIMATIC WinCC (Austin SCADA)",
    props: { system_type: "SCADA", version: "WinCC V7.5 SP2", last_patched: "2025-11-08" },
  },
  {
    id: "sys_mes_munich",
    type: "System",
    label: "Siemens Opcenter MES (Munich)",
    props: { system_type: "MES", version: "Opcenter 2306", last_patched: "2026-01-22" },
  },
  {
    id: "sys_logistics",
    type: "System",
    label: "Global Logistics Hub",
    props: { system_type: "Logistics", version: "2026.1", last_patched: "2026-05-01" },
  },
];

// Quick lookup helper used while building edges.
function w(weight: number) {
  return weight;
}

export const edges: GraphEdge[] = [
  // Manufacturer SOURCES_FROM Supplier
  { source: MANUFACTURER_ID, target: "sup_roboflex", type: "SOURCES_FROM", props: { spend: 14_500_000, is_sole_source: true, contract_end: "2027-03-31", weight: w(1.0) } },
  { source: MANUFACTURER_ID, target: "sup_servotech", type: "SOURCES_FROM", props: { spend: 22_000_000, is_sole_source: false, contract_end: "2028-06-30", weight: w(0.4) } },
  { source: MANUFACTURER_ID, target: "sup_flexsys", type: "SOURCES_FROM", props: { spend: 18_200_000, is_sole_source: false, contract_end: "2027-12-31", weight: w(0.4) } },
  { source: MANUFACTURER_ID, target: "sup_nanocomp", type: "SOURCES_FROM", props: { spend: 9_800_000, is_sole_source: true, contract_end: "2026-12-31", weight: w(1.0) } },
  { source: MANUFACTURER_ID, target: "sup_nordicdrive", type: "SOURCES_FROM", props: { spend: 12_400_000, is_sole_source: false, contract_end: "2028-01-31", weight: w(0.4) } },
  { source: MANUFACTURER_ID, target: "sup_voltcore", type: "SOURCES_FROM", props: { spend: 41_000_000, is_sole_source: true, contract_end: "2027-09-30", weight: w(1.0) } },
  { source: MANUFACTURER_ID, target: "sup_precision", type: "SOURCES_FROM", props: { spend: 7_600_000, is_sole_source: false, contract_end: "2028-03-31", weight: w(0.4) } },
  { source: MANUFACTURER_ID, target: "sup_wirewerks", type: "SOURCES_FROM", props: { spend: 5_300_000, is_sole_source: false, contract_end: "2027-06-30", weight: w(0.4) } },
  { source: MANUFACTURER_ID, target: "sup_pacrim", type: "SOURCES_FROM", props: { spend: 8_900_000, is_sole_source: false, contract_end: "2028-02-28", weight: w(0.4) } },
  { source: MANUFACTURER_ID, target: "sup_northstar", type: "SOURCES_FROM", props: { spend: 16_700_000, is_sole_source: false, contract_end: "2028-08-31", weight: w(0.4) } },
  { source: MANUFACTURER_ID, target: "sup_iolink", type: "SOURCES_FROM", props: { spend: 4_100_000, is_sole_source: false, contract_end: "2027-04-30", weight: w(0.4) } },

  // Supplier PROVIDES Component
  { source: "sup_roboflex", target: "comp_servo", type: "PROVIDES", props: { volume_per_month: 12_000, lead_time_days: 18, is_sole_source: true, weight: w(1.0) } },
  { source: "sup_roboflex", target: "comp_controller", type: "PROVIDES", props: { volume_per_month: 9_500, lead_time_days: 18, is_sole_source: false, weight: w(0.6) } },
  { source: "sup_servotech", target: "comp_servo", type: "PROVIDES", props: { volume_per_month: 8_000, lead_time_days: 9, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_flexsys", target: "comp_controller", type: "PROVIDES", props: { volume_per_month: 11_000, lead_time_days: 12, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_flexsys", target: "comp_plc", type: "PROVIDES", props: { volume_per_month: 6_500, lead_time_days: 12, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_northstar", target: "comp_controller", type: "PROVIDES", props: { volume_per_month: 10_000, lead_time_days: 10, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_nanocomp", target: "comp_power_module", type: "PROVIDES", props: { volume_per_month: 5_000, lead_time_days: 22, is_sole_source: true, weight: w(1.0) } },
  { source: "sup_nordicdrive", target: "comp_power_module", type: "PROVIDES", props: { volume_per_month: 4_200, lead_time_days: 14, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_voltcore", target: "comp_battery_cell", type: "PROVIDES", props: { volume_per_month: 2_000_000, lead_time_days: 16, is_sole_source: true, weight: w(1.0) } },
  { source: "sup_precision", target: "comp_bearing", type: "PROVIDES", props: { volume_per_month: 30_000, lead_time_days: 11, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_precision", target: "comp_sensor", type: "PROVIDES", props: { volume_per_month: 14_000, lead_time_days: 11, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_iolink", target: "comp_sensor", type: "PROVIDES", props: { volume_per_month: 9_000, lead_time_days: 9, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_wirewerks", target: "comp_wiring", type: "PROVIDES", props: { volume_per_month: 20_000, lead_time_days: 8, is_sole_source: false, weight: w(0.4) } },
  { source: "sup_pacrim", target: "comp_plc", type: "PROVIDES", props: { volume_per_month: 5_800, lead_time_days: 13, is_sole_source: false, weight: w(0.4) } },

  // Component USED_IN Product
  { source: "comp_servo", target: "prod_hx9", type: "USED_IN", props: { quantity: 2, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_servo", target: "prod_eaxle", type: "USED_IN", props: { quantity: 3, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_controller", target: "prod_hx9", type: "USED_IN", props: { quantity: 1, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_controller", target: "prod_drivecore", type: "USED_IN", props: { quantity: 1, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_plc", target: "prod_drivecore", type: "USED_IN", props: { quantity: 2, is_critical_path: false, weight: w(0.6) } },
  { source: "comp_power_module", target: "prod_eaxle", type: "USED_IN", props: { quantity: 4, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_power_module", target: "prod_drivecore", type: "USED_IN", props: { quantity: 2, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_battery_cell", target: "prod_bms", type: "USED_IN", props: { quantity: 4416, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_battery_cell", target: "prod_eaxle", type: "USED_IN", props: { quantity: 1200, is_critical_path: true, weight: w(1.0) } },
  { source: "comp_sensor", target: "prod_hx9", type: "USED_IN", props: { quantity: 6, is_critical_path: false, weight: w(0.6) } },
  { source: "comp_sensor", target: "prod_eaxle", type: "USED_IN", props: { quantity: 8, is_critical_path: false, weight: w(0.6) } },
  { source: "comp_wiring", target: "prod_eaxle", type: "USED_IN", props: { quantity: 1, is_critical_path: false, weight: w(0.4) } },
  { source: "comp_bearing", target: "prod_hx9", type: "USED_IN", props: { quantity: 4, is_critical_path: false, weight: w(0.4) } },

  // Product MANUFACTURED_AT Plant
  { source: "prod_hx9", target: "plant_austin", type: "MANUFACTURED_AT", props: { primary: true, capacity_pct: 70, weight: w(1.0) } },
  { source: "prod_hx9", target: "plant_pune", type: "MANUFACTURED_AT", props: { primary: false, capacity_pct: 30, weight: w(0.5) } },
  { source: "prod_eaxle", target: "plant_austin", type: "MANUFACTURED_AT", props: { primary: true, capacity_pct: 60, weight: w(1.0) } },
  { source: "prod_eaxle", target: "plant_munich", type: "MANUFACTURED_AT", props: { primary: false, capacity_pct: 40, weight: w(0.7) } },
  { source: "prod_drivecore", target: "plant_munich", type: "MANUFACTURED_AT", props: { primary: true, capacity_pct: 80, weight: w(1.0) } },
  { source: "prod_bms", target: "plant_guadalajara", type: "MANUFACTURED_AT", props: { primary: true, capacity_pct: 100, weight: w(1.0) } },

  // System CONNECTS_TO System (network topology) + supplier ERP integration paths
  { source: "sys_sap_austin", target: "sys_scada_austin", type: "CONNECTS_TO", props: { protocol: "OPC-UA", auth_method: "cert", encrypted: true, weight: w(0.5) } },
  { source: "sys_scada_austin", target: "sys_logistics", type: "CONNECTS_TO", props: { protocol: "MQTT", auth_method: "token", encrypted: true, weight: w(0.4) } },
  { source: "sys_sap_austin", target: "sys_mes_munich", type: "CONNECTS_TO", props: { protocol: "REST", auth_method: "oauth", encrypted: true, weight: w(0.4) } },
  { source: "sup_roboflex", target: "sys_sap_austin", type: "CONNECTS_TO", props: { protocol: "EDI-VPN", auth_method: "shared_key", encrypted: false, weight: w(0.8) } },
  { source: "sup_voltcore", target: "sys_sap_austin", type: "CONNECTS_TO", props: { protocol: "REST", auth_method: "oauth", encrypted: true, weight: w(0.4) } },
];

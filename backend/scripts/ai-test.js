import "../lib/env.js";
import { aiRiskSummary, isAiEnabled } from "../lib/ai.js";

async function main() {
  console.log("AI enabled:", isAiEnabled());
  console.log("Provider:", process.env.AI_PROVIDER, "| Model:", process.env.AI_MODEL);
  console.log("Base URL set:", !!process.env.AI_BASE_URL, "| Key set:", !!process.env.AI_API_KEY);
  console.log("\nCalling the AI gateway...\n");

  const out = await aiRiskSummary({
    supplier_id: "sup_roboflex",
    name: "RoboFlex Systems",
    tier: 3,
    country: "Vietnam",
    risk_score: 88,
    risk_delta: 48,
    band: "critical",
    max_cvss: 9.8,
    breach_indicator: true,
    patch_lag_days: 14,
    connected_plant_count: 3,
    open_cve_count: 4,
    open_cves: ["CVE-2026-3847"],
    summary: "test",
  });

  if (out) {
    console.log("LIVE AI RESPONSE:\n" + out);
  } else {
    console.log("No AI response (call failed or not configured). Check the error above.");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

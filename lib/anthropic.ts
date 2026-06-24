import Anthropic from "@anthropic-ai/sdk";
import type { ImpactAssessment, MitigationPlan, RiskProfile } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

export function isAiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function ask(system: string, user: string): Promise<string | null> {
  const c = client();
  if (!c) return null;
  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && "text" in block ? block.text.trim() : null;
  } catch (e) {
    console.error("Anthropic call failed:", (e as Error).message);
    return null;
  }
}

// Agent 1 — Supplier Risk Intelligence Agent
export async function aiRiskSummary(profile: RiskProfile): Promise<string | null> {
  const system =
    "You are a supply chain cyber risk analyst. Given a supplier risk profile derived from live CVE and CISA KEV data, write a single concise, executive-ready sentence summarizing the risk and the single most important recommended action. No preamble.";
  const user = JSON.stringify(profile);
  return ask(system, user);
}

// Agent 2 — Impact Simulation Agent
export async function aiImpactSummary(
  impact: ImpactAssessment,
  query: string
): Promise<string | null> {
  const system =
    "You are a supply chain cyber risk analyst. You are given a deterministic blast-radius impact assessment computed from a real dependency graph. Explain the business impact in 2-3 sentences for a CISO. Reference the affected plants, downtime, and revenue at risk. Do not invent numbers beyond those provided.";
  const user = `User question: ${query}\n\nComputed impact assessment:\n${JSON.stringify(impact)}`;
  return ask(system, user);
}

// Agent 3 — Mitigation Recommendation Agent
export async function aiMitigationSummary(plan: MitigationPlan): Promise<string | null> {
  const system =
    "You are a supply chain incident response lead. Given a prioritized mitigation plan and ranked alternate suppliers, write a 2-3 sentence executive briefing on the recommended response strategy and the top alternate supplier. No preamble.";
  const user = JSON.stringify(plan);
  return ask(system, user);
}

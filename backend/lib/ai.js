import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";

// ---------------------------------------------------------------------------
// AI agents (Risk Intelligence, Impact Simulation, Mitigation).
//
// The hackathon uses the PwC "Gen AI Shared Services Portal" — an
// OpenAI-compatible gateway with an `sk-...` virtual key and the GPT-4 family
// of models — so "openai" is the default provider. "anthropic" (incl. a
// Bedrock-fronting gateway) and direct "bedrock" remain supported.
//
//   AI_PROVIDER   "openai" (default) | "anthropic" | "bedrock"
//   AI_BASE_URL   gateway/portal base URL (required for openai + anthropic gateway)
//   AI_API_KEY    the portal virtual key (sk-...)
//   AI_MODEL      model id (default: gpt-4o for the GPT-4 family)
//   AWS_REGION    + AWS creds for direct "bedrock" mode
//
// If the provider isn't reachable, the platform transparently falls back to
// its deterministic, computed summaries.
// ---------------------------------------------------------------------------

function provider() {
  const p = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (p === "anthropic" || p === "bedrock") return p;
  return "openai";
}

function apiKey() {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
}

function baseURL() {
  return (
    process.env.AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    process.env.ANTHROPIC_BASE_URL ||
    undefined
  );
}

function model() {
  return process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || "gpt-4o";
}

function bedrockConfigured() {
  return !!(
    process.env.AWS_REGION ||
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_BEARER_TOKEN_BEDROCK
  );
}

export function isAiEnabled() {
  switch (provider()) {
    case "openai":
      // A gateway needs a base URL; the public OpenAI API just needs a key.
      return !!apiKey();
    case "anthropic":
      return !!apiKey();
    case "bedrock":
      return bedrockConfigured();
    default:
      return false;
  }
}

function extractAnthropicText(content) {
  const block = content.find((b) => b.type === "text");
  return block?.text ? block.text.trim() : null;
}

async function ask(system, user) {
  const m = provider();
  const mdl = m === "bedrock" ? model().replace(/^bedrock\./, "") : model();
  try {
    if (m === "openai") {
      const key = apiKey();
      if (!key) return null;
      const client = new OpenAI({ apiKey: key, baseURL: baseURL() });
      const res = await client.chat.completions.create({
        model: mdl,
        max_tokens: 600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      return res.choices[0]?.message?.content?.trim() ?? null;
    }

    const messages = [{ role: "user", content: user }];
    if (m === "bedrock") {
      if (!bedrockConfigured()) return null;
      const client = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION || "us-east-1" });
      const res = await client.messages.create({ model: mdl, max_tokens: 600, system, messages });
      return extractAnthropicText(res.content);
    }

    // anthropic (direct or gateway via base URL)
    const key = apiKey();
    if (!key) return null;
    const client = new Anthropic({ apiKey: key, baseURL: baseURL() });
    const res = await client.messages.create({ model: mdl, max_tokens: 600, system, messages });
    return extractAnthropicText(res.content);
  } catch (e) {
    console.error(`AI call failed (${m} / ${mdl}):`, e.message);
    return null;
  }
}

// Agent 1 — Supplier Risk Intelligence Agent
export async function aiRiskSummary(profile) {
  const system =
    "You are a supply chain cyber risk analyst. Given a supplier risk profile derived from live CVE and CISA KEV data, write a single concise, executive-ready sentence summarizing the risk and the single most important recommended action. No preamble.";
  return ask(system, JSON.stringify(profile));
}

// Agent 2 — Impact Simulation Agent
export async function aiImpactSummary(impact, query) {
  const system =
    "You are a supply chain cyber risk analyst. You are given a deterministic blast-radius impact assessment computed from a real dependency graph. Explain the business impact in 2-3 sentences for a CISO. Reference the affected plants, downtime, and revenue at risk. Do not invent numbers beyond those provided.";
  const user = `User question: ${query}\n\nComputed impact assessment:\n${JSON.stringify(impact)}`;
  return ask(system, user);
}

// Agent 3 — Mitigation Recommendation Agent
export async function aiMitigationSummary(plan) {
  const system =
    "You are a supply chain incident response lead. Given a prioritized mitigation plan and ranked alternate suppliers, write a 2-3 sentence executive briefing on the recommended response strategy and the top alternate supplier. No preamble.";
  return ask(system, JSON.stringify(plan));
}

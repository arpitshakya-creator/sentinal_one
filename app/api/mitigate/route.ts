import { NextRequest, NextResponse } from "next/server";
import { assessImpact } from "@/lib/impact";
import { buildMitigationPlan } from "@/lib/mitigation";
import { aiMitigationSummary } from "@/lib/anthropic";
import type { ImpactAssessment } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supplierId: string | undefined = body.supplier_id;
  if (!supplierId) {
    return NextResponse.json({ error: "supplier_id is required" }, { status: 400 });
  }

  try {
    const impact: ImpactAssessment =
      body.impact_assessment ?? (await assessImpact(supplierId, body.scenario || "ransomware"));
    const plan = await buildMitigationPlan(supplierId, impact);
    const summary = await aiMitigationSummary(plan);
    if (summary) plan.ai_summary = summary;
    return NextResponse.json({ plan, impact, ai_enabled: !!summary });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

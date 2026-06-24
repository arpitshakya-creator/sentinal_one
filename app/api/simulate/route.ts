import { NextRequest, NextResponse } from "next/server";
import { assessImpact } from "@/lib/impact";
import { aiImpactSummary } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

function inferSupplierFromQuery(query: string, suppliers: { id: string; name: string }[]) {
  const q = query.toLowerCase();
  return suppliers.find((s) => q.includes(s.name.toLowerCase().split(" ")[0]));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  let supplierId: string | undefined = body.supplier_id;
  const scenario: string = body.scenario || "ransomware";
  const query: string = body.query || "";

  // Allow natural-language entry: resolve supplier from the query text.
  if (!supplierId && query) {
    const { getRiskProfiles } = await import("@/lib/risk");
    const profiles = await getRiskProfiles();
    const match = inferSupplierFromQuery(
      query,
      profiles.map((p) => ({ id: p.supplier_id, name: p.name }))
    );
    supplierId = match?.id;
  }

  if (!supplierId) {
    return NextResponse.json(
      { error: "Could not resolve a supplier. Provide supplier_id or name the supplier in your query." },
      { status: 400 }
    );
  }

  try {
    const impact = await assessImpact(supplierId, scenario);
    const summary = await aiImpactSummary(impact, query || `What happens if ${impact.supplier_name} is hit by ${scenario}?`);
    if (summary) impact.ai_summary = summary;
    return NextResponse.json({ impact, ai_enabled: !!summary });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

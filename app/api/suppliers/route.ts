import { NextResponse } from "next/server";
import { getRiskProfiles } from "@/lib/risk";

export const dynamic = "force-dynamic";

export async function GET() {
  const profiles = await getRiskProfiles();
  return NextResponse.json({ suppliers: profiles });
}

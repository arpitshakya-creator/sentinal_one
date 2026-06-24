import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAiEnabled } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const cves = await db.query<{ count: number }>("SELECT count(*) AS count FROM cves");
  const kev = await db.query<{ count: number }>(
    "SELECT count(*) AS count FROM cves WHERE known_exploited = 1"
  );
  const threats = await db.query<{ count: number }>(
    "SELECT count(*) AS count FROM threat_events"
  );
  const lastIngest = await db.query<{ ts: string }>(
    "SELECT max(ingested_at) AS ts FROM cves"
  );

  return NextResponse.json({
    ai_enabled: isAiEnabled(),
    cve_count: Number(cves.rows[0]?.count ?? 0),
    kev_count: Number(kev.rows[0]?.count ?? 0),
    threat_count: Number(threats.rows[0]?.count ?? 0),
    last_ingest: lastIngest.rows[0]?.ts ?? null,
  });
}

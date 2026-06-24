import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const supplier = req.nextUrl.searchParams.get("supplier");

  if (supplier) {
    const res = await db.query(
      `SELECT c.*, nc.matched_keyword
       FROM node_cves nc JOIN cves c ON c.id = nc.cve_id
       WHERE nc.node_id = $1 ORDER BY c.cvss DESC`,
      [supplier]
    );
    return NextResponse.json({ cves: res.rows });
  }

  const res = await db.query(
    `SELECT * FROM cves ORDER BY known_exploited DESC, cvss DESC, ingested_at DESC LIMIT 100`
  );
  return NextResponse.json({ cves: res.rows });
}

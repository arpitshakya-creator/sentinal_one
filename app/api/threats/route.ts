import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const res = await db.query(
    `SELECT te.*, n.label AS supplier_name
     FROM threat_events te LEFT JOIN nodes n ON n.id = te.supplier_id
     ORDER BY te.timestamp DESC LIMIT 50`
  );
  return NextResponse.json({ threats: res.rows });
}

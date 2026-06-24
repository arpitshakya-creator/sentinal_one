import "../lib/env";
import { getDb } from "../lib/db";

async function main() {
  const db = await getDb();
  const nodes = await db.query<{ count: number }>("SELECT count(*) AS count FROM nodes");
  const edges = await db.query<{ count: number }>("SELECT count(*) AS count FROM edges");
  console.log("Database initialized at ./data/sentinel.db");
  console.log(`  nodes: ${nodes.rows[0].count}`);
  console.log(`  edges: ${edges.rows[0].count}`);
  console.log("Run `npm run ingest` to pull live CVE intelligence.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

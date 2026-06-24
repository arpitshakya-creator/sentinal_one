import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { nodes as seedNodes, edges as seedEdges } from "./seed-data";

// ---------------------------------------------------------------------------
// Real on-disk relational database backed by SQLite (Node's built-in
// `node:sqlite`). Data persists to ./data/sentinel.db across restarts and
// supports real SQL, transactions and the JSON1 extension. JSON columns
// (`props`, `linked_cves`) are stored as TEXT and parsed transparently by the
// query wrapper below, which also exposes a Promise-based API and Postgres-style
// `$n` placeholders so the rest of the codebase reads naturally.
// ---------------------------------------------------------------------------

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "sentinel.db");
const JSON_COLUMNS = new Set(["props", "linked_cves"]);

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
}

function normalizeParam(v: unknown): unknown {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === undefined) return null;
  return v;
}

// Translate Postgres-style `$1..$n` placeholders into positional `?`, while
// reordering the bound parameters to match their textual order of appearance.
function translate(sql: string, params: unknown[]): { sql: string; params: unknown[] } {
  const order: number[] = [];
  const out = sql.replace(/\$(\d+)/g, (_, n: string) => {
    order.push(Number(n));
    return "?";
  });
  if (order.length === 0) return { sql, params: params.map(normalizeParam) };
  return { sql: out, params: order.map((n) => normalizeParam(params[n - 1])) };
}

function parseRow<T>(row: Record<string, unknown>): T {
  for (const key of Object.keys(row)) {
    if (JSON_COLUMNS.has(key) && typeof row[key] === "string") {
      try {
        row[key] = JSON.parse(row[key] as string);
      } catch {
        /* leave as-is */
      }
    }
  }
  return row as T;
}

const isRead = (sql: string) => /^\s*(SELECT|WITH|PRAGMA)/i.test(sql);

export class Database {
  constructor(private readonly raw: DatabaseSync) {}

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const t = translate(sql, params);
    const stmt = this.raw.prepare(t.sql);
    if (isRead(t.sql)) {
      const rows = stmt.all(...(t.params as never[])) as Record<string, unknown>[];
      return { rows: rows.map((r) => parseRow<T>(r)) };
    }
    stmt.run(...(t.params as never[]));
    return { rows: [] };
  }

  async exec(sql: string): Promise<void> {
    this.raw.exec(sql);
  }

  async transaction(fn: (tx: Database) => Promise<void>): Promise<void> {
    this.raw.exec("BEGIN");
    try {
      await fn(this);
      this.raw.exec("COMMIT");
    } catch (e) {
      this.raw.exec("ROLLBACK");
      throw e;
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __sentinel_db: Promise<Database> | undefined;
}

async function init(): Promise<Database> {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const raw = new DatabaseSync(DB_FILE);
  raw.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const db = new Database(raw);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id    TEXT PRIMARY KEY,
      type  TEXT NOT NULL,
      label TEXT NOT NULL,
      props TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS edges (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      type   TEXT NOT NULL,
      props  TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS cves (
      id              TEXT PRIMARY KEY,
      cvss            REAL NOT NULL DEFAULT 0,
      severity        TEXT,
      description     TEXT,
      published       TEXT,
      source          TEXT NOT NULL,
      vendor          TEXT,
      product         TEXT,
      known_exploited INTEGER NOT NULL DEFAULT 0,
      url             TEXT,
      ingested_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS node_cves (
      node_id         TEXT NOT NULL,
      cve_id          TEXT NOT NULL,
      matched_keyword TEXT,
      PRIMARY KEY (node_id, cve_id)
    );

    CREATE TABLE IF NOT EXISTS threat_events (
      event_id    TEXT PRIMARY KEY,
      source      TEXT NOT NULL,
      supplier_id TEXT,
      type        TEXT,
      severity    TEXT,
      timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
      description TEXT,
      linked_cves TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS risk_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id TEXT NOT NULL,
      score       REAL NOT NULL,
      delta       REAL NOT NULL DEFAULT 0,
      ts          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
    CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
    CREATE INDEX IF NOT EXISTS idx_node_cves_node ON node_cves(node_id);
  `);

  await ensureSeeded(db);
  return db;
}

async function ensureSeeded(db: Database) {
  const res = await db.query<{ count: number }>("SELECT count(*) AS count FROM nodes");
  if (Number(res.rows[0]?.count ?? 0) > 0) return;

  await db.transaction(async (tx) => {
    for (const n of seedNodes) {
      await tx.query("INSERT INTO nodes (id, type, label, props) VALUES ($1,$2,$3,$4)", [
        n.id,
        n.type,
        n.label,
        JSON.stringify(n.props ?? {}),
      ]);
    }
    for (const e of seedEdges) {
      await tx.query("INSERT INTO edges (source, target, type, props) VALUES ($1,$2,$3,$4)", [
        e.source,
        e.target,
        e.type,
        JSON.stringify(e.props ?? {}),
      ]);
    }
  });
}

export function getDb(): Promise<Database> {
  if (!global.__sentinel_db) {
    global.__sentinel_db = init();
  }
  return global.__sentinel_db;
}

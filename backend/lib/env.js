import fs from "node:fs";
import path from "node:path";

// Minimal .env loader (no external dependency). Loads .env.local then .env from
// the backend working directory, without overriding variables already set.
function load(file) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf-8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

load(".env.local");
load(".env");

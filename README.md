# SupplyChain Sentinel AI

Real-time cyber risk intelligence for multi-tier supply chains — live CVE feeds
(NIST NVD + CISA KEV), a dependency graph, weighted blast-radius simulation, and
AI-generated mitigation playbooks.

The project is split into two independent apps (all JavaScript):

```
Sentinal/
├── backend/    Express API + SQLite (node:sqlite) + ingestion + risk engine + AI agents
└── frontend/   Vite + React + React Router dashboard
```

## Architecture

- **backend/** — a plain Node.js Express server (ES modules). It owns the real
  on-disk SQLite database (`backend/data/sentinel.db`), the live CVE ingestion
  (NVD + CISA KEV), the risk-scoring/blast-radius/mitigation engine, and the
  three LLM agents. It exposes a JSON REST API under `/api/*`.
- **frontend/** — a Vite + React single-page app. In development it proxies
  `/api/*` to the backend (default `http://localhost:4000`), so the browser
  always calls relative paths.

## Prerequisites

- Node.js 22.5+ (uses the built-in `node:sqlite` module; Node 25 recommended).

## 1) Backend

```bash
cd backend
npm install
cp .env.example .env.local   # then fill in AI_API_KEY / AI_BASE_URL (optional)
npm run seed                 # initialize + seed the SQLite database
npm run ingest               # pull live CVE intelligence from NVD + CISA KEV
npm run dev                  # start the API on http://localhost:4000
```

`.env.local` keys:

| Variable      | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| `PORT`        | API port (default `4000`).                                       |
| `AI_PROVIDER` | `openai` (default) \| `anthropic` \| `bedrock`.                  |
| `AI_API_KEY`  | Portal virtual key (`sk-...`). Without it, AI summaries are off. |
| `AI_BASE_URL` | OpenAI-compatible gateway base URL (required in `openai` mode).  |
| `AI_MODEL`    | Model id (GPT-4 family recommended).                             |
| `NVD_API_KEY` | Optional NVD key for faster ingestion.                           |

The platform works fully without AI — it falls back to deterministic, computed
summaries. AI only adds the executive narrative text.

## 2) Frontend

```bash
cd frontend
npm install
npm run dev                  # start the dashboard on http://localhost:5173
```

To point the dev proxy cd a non-default backend, set `VITE_API_TARGET`
(e.g. `VITE_API_TARGET=http://localhost:5000 npm run dev`).

## API

| Method | Route            | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| GET    | `/api/status`    | CVE/KEV counts, AI status.                     |
| GET    | `/api/suppliers` | Supplier risk profiles (leaderboard).          |
| GET    | `/api/graph`     | Full dependency graph (nodes + edges).         |
| GET    | `/api/cves`      | CVEs (optionally `?supplier=<id>`).            |
| GET    | `/api/threats`   | Threat events (CISA KEV signals).              |
| POST   | `/api/simulate`  | Blast-radius impact assessment for a supplier. |
| POST   | `/api/mitigate`  | Mitigation plan + ranked alternate suppliers.  |
| POST   | `/api/ingest`    | Pull live CVE intelligence and recompute risk. |

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ImpactAssessment, RiskProfile } from "@/lib/types";
import { SectionTitle } from "@/components/widgets";

const SCENARIOS = [
  { id: "ransomware", label: "Ransomware" },
  { id: "credential_dump", label: "Credential breach" },
  { id: "data_exfiltration", label: "Data exfiltration" },
  { id: "supply_disruption", label: "Supply disruption" },
];

interface Turn {
  role: "user" | "agent";
  text?: string;
  impact?: ImpactAssessment;
  aiEnabled?: boolean;
}

function SimulatorInner() {
  const params = useSearchParams();
  const [suppliers, setSuppliers] = useState<RiskProfile[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [scenario, setScenario] = useState("ransomware");
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => {
        setSuppliers(d.suppliers ?? []);
        const fromUrl = params.get("supplier");
        setSupplierId(fromUrl || d.suppliers?.[0]?.supplier_id || "");
      });
  }, [params]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const run = async (query: string) => {
    if (busy) return;
    const supplier = suppliers.find((s) => s.supplier_id === supplierId);
    const q = query || `What happens if ${supplier?.name ?? "this supplier"} is hit by ${scenario}?`;
    setTurns((t) => [...t, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier_id: supplierId, scenario, query: q }),
      });
      const data = await res.json();
      if (data.error) {
        setTurns((t) => [...t, { role: "agent", text: `⚠ ${data.error}` }]);
      } else {
        setTurns((t) => [...t, { role: "agent", impact: data.impact, aiEnabled: data.ai_enabled }]);
      }
    } catch (e) {
      setTurns((t) => [...t, { role: "agent", text: `⚠ ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Impact Simulator</h1>
        <p className="text-sm text-slate-500">
          Ask what happens when a supplier is compromised. Blast radius, downtime and revenue impact
          are computed from the live dependency graph.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="rounded-lg border border-line bg-bg-elevated px-3 py-2 text-sm"
        >
          {suppliers.map((s) => (
            <option key={s.supplier_id} value={s.supplier_id}>
              {s.name} · risk {s.risk_score}
            </option>
          ))}
        </select>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="rounded-lg border border-line bg-bg-elevated px-3 py-2 text-sm"
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <button onClick={() => run("")} disabled={busy || !supplierId} className="btn btn-primary">
          {busy ? "Analyzing…" : "Run simulation"}
        </button>
      </div>

      <div className="card min-h-[420px]">
        {turns.length === 0 && (
          <div className="grid h-full place-items-center py-16 text-center">
            <div>
              <p className="text-sm text-slate-400">
                Pick a supplier and scenario, or ask a question below.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "What happens if RoboFlex is hit by ransomware?",
                  "Simulate a breach at VoltCore Energy",
                  "What is the revenue impact if NanoComp goes down?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => run(q)}
                    className="btn btn-ghost text-xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent/15 px-4 py-2 text-sm text-slate-100">
                  {t.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="w-full max-w-[92%]">
                  {t.text ? (
                    <div className="rounded-2xl rounded-bl-sm bg-bg-soft px-4 py-2 text-sm text-slate-200">
                      {t.text}
                    </div>
                  ) : (
                    t.impact && <ImpactResult impact={t.impact} aiEnabled={t.aiEnabled} />
                  )}
                </div>
              </div>
            )
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask: what happens if RoboFlex is hit by ransomware?"
          className="flex-1 rounded-lg border border-line bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent/50"
        />
        <button type="submit" disabled={busy} className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}

function ImpactResult({ impact, aiEnabled }: { impact: ImpactAssessment; aiEnabled?: boolean }) {
  return (
    <div className="space-y-3 rounded-2xl rounded-bl-sm border border-line bg-bg-soft p-4 animate-slideUp">
      <div className="flex items-center justify-between">
        <SectionTitle title={`Impact Assessment · ${impact.supplier_name}`} subtitle={`Scenario: ${impact.scenario}`} />
        <span
          className={`tag ${
            impact.confidence === "high"
              ? "bg-risk-low/15 text-risk-low"
              : impact.confidence === "medium"
              ? "bg-risk-medium/15 text-risk-medium"
              : "bg-slate-700/40 text-slate-400"
          }`}
        >
          {impact.confidence} confidence
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Cell label="Affected plants" value={impact.affected_plants} />
        <Cell label="Est. downtime" value={`${impact.estimated_downtime_days} days`} />
        <Cell label="Revenue at risk" value={impact.revenue_at_risk_usd} accent />
        <Cell label="Blast nodes" value={impact.blast_radius_nodes.length} />
      </div>

      {impact.ai_summary && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-accent">Claude AI analysis</div>
          <p className="text-sm text-slate-200">{impact.ai_summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Critical products</div>
          <ul className="space-y-1 text-sm text-slate-300">
            {impact.critical_products.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-critical" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Affected plants</div>
          <ul className="space-y-1 text-sm text-slate-300">
            {impact.affected_plant_names.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {impact.linked_cves.length > 0 && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Linked CVEs</div>
          <div className="flex flex-wrap gap-1.5">
            {impact.linked_cves.map((c) => (
              <a
                key={c}
                href={`https://nvd.nist.gov/vuln/detail/${c}`}
                target="_blank"
                rel="noreferrer"
                className="tag bg-bg-elevated font-mono text-accent hover:bg-bg-card"
              >
                {c}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="text-[11px] text-slate-500">
          {aiEnabled ? "Computed from graph + Claude AI" : "Computed from live graph data"}
        </span>
        <Link href={`/mitigation?supplier=${impact.supplier_id}`} className="btn btn-primary px-3 py-1.5 text-xs">
          Generate mitigation plan →
        </Link>
      </div>
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${accent ? "text-risk-critical" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-slate-500">Loading…</div>}>
      <SimulatorInner />
    </Suspense>
  );
}

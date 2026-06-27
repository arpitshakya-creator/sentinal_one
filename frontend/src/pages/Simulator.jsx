import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SectionTitle } from "../components/widgets.jsx";

const BAND_HEX = { critical: "#e0301e", medium: "#ffb600", low: "#22c55e" };
const RATING_BAND = { Critical: "critical", High: "critical", Medium: "medium", Low: "low" };

const SCENARIOS = [
  { id: "ransomware", label: "Ransomware" },
  { id: "credential_dump", label: "Credential breach" },
  { id: "data_exfiltration", label: "Data exfiltration" },
  { id: "supply_disruption", label: "Supply disruption" },
];

export default function Simulator() {
  const [params] = useSearchParams();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [scenario, setScenario] = useState("ransomware");
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [standardsCatalog, setStandardsCatalog] = useState([]);
  const [selectedStds, setSelectedStds] = useState([]);
  const endRef = useRef(null);

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
    fetch("/api/standards")
      .then((r) => r.json())
      .then((d) => {
        const list = d.standards ?? [];
        setStandardsCatalog(list);
        setSelectedStds(list.map((s) => s.id));
      });
  }, []);

  const toggleStd = (id) =>
    setSelectedStds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const run = async (query) => {
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
        body: JSON.stringify({ supplier_id: supplierId, scenario, query: q, standards: selectedStds }),
      });
      const data = await res.json();
      if (data.error) {
        setTurns((t) => [...t, { role: "agent", text: `⚠ ${data.error}` }]);
      } else {
        setTurns((t) => [...t, { role: "agent", impact: data.impact, aiEnabled: data.ai_enabled }]);
      }
    } catch (e) {
      setTurns((t) => [...t, { role: "agent", text: `⚠ ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const selected = suppliers.find((s) => s.supplier_id === supplierId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Impact Simulator</h1>
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

      {standardsCatalog.length > 0 && (
        <div className="rounded-lg border border-line bg-bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Simulate against standards
            </span>
            <div className="flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedStds(standardsCatalog.map((s) => s.id))}
                className="text-accent hover:underline"
              >
                Select all
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setSelectedStds([])}
                className="text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {standardsCatalog.map((s) => {
              const on = selectedStds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStd(s.id)}
                  title={s.summary}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    on
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line bg-bg-elevated text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-bg-soft px-3 py-2 text-xs">
          <span className="text-slate-500">Standards posture:</span>
          {selected.cvss_severity && (
            <span
              className="tag"
              style={{
                background: `${BAND_HEX[selected.cvss_severity.band]}22`,
                color: BAND_HEX[selected.cvss_severity.band],
              }}
              title={`Highest CVSS v3.1 base score: ${Number(selected.max_cvss).toFixed(1)}`}
            >
              CVSS v3.1 {selected.cvss_severity.label}
            </span>
          )}
          {selected.breach_indicator && (
            <span className="tag bg-risk-critical/15 text-risk-critical" title="Listed in the CISA Known Exploited Vulnerabilities catalog">
              CISA KEV
            </span>
          )}
          {selected.iso27005 && (
            <span
              className="tag"
              style={{
                background: `${BAND_HEX[RATING_BAND[selected.iso27005.risk_rating] ?? "low"]}22`,
                color: BAND_HEX[RATING_BAND[selected.iso27005.risk_rating] ?? "low"],
              }}
              title={`${selected.iso27005.methodology} — Likelihood: ${selected.iso27005.likelihood.level}, Consequence: ${selected.iso27005.consequence.level}`}
            >
              ISO 27005: {selected.iso27005.risk_rating}
            </span>
          )}
          {selected.iso27005 && (
            <span className="text-slate-500">
              Likelihood <span className="text-slate-600">{selected.iso27005.likelihood.level}</span> × Consequence{" "}
              <span className="text-slate-600">{selected.iso27005.consequence.level}</span>
            </span>
          )}
        </div>
      )}

      <div className="card min-h-[420px]">
        {turns.length === 0 && (
          <div className="grid h-full place-items-center py-16 text-center">
            <div>
              <p className="text-sm text-slate-500">
                Pick a supplier and scenario, or ask a question below.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "What happens if RoboFlex is hit by ransomware?",
                  "Simulate a breach at VoltCore Energy",
                  "What is the revenue impact if NanoComp goes down?",
                ].map((q) => (
                  <button key={q} onClick={() => run(q)} className="btn btn-ghost text-xs">
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
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent/15 px-4 py-2 text-sm text-slate-900">
                  {t.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="w-full max-w-[92%]">
                  {t.text ? (
                    <div className="rounded-2xl rounded-bl-sm bg-bg-soft px-4 py-2 text-sm text-slate-700">
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

function ImpactResult({ impact, aiEnabled }) {
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
              : "bg-slate-200 text-slate-500"
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
          <div className="mb-1 text-[10px] uppercase tracking-wider text-accent">AI analysis</div>
          <p className="text-sm text-slate-700">{impact.ai_summary}</p>
        </div>
      )}

      <ComplianceChecklist data={impact.compliance_checklist} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Critical products</div>
          <ul className="space-y-1 text-sm text-slate-600">
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
          <ul className="space-y-1 text-sm text-slate-600">
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
        <Link to={`/mitigation?supplier=${impact.supplier_id}`} className="btn btn-primary px-3 py-1.5 text-xs">
          Generate mitigation plan →
        </Link>
      </div>
    </div>
  );
}

const STATUS_HEX = { gap: "#dc2626", partial: "#d97706", met: "#16a34a" };

function StandardsAnalysis({ items }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
        Standards-based analysis
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((b) => (
          <div key={b.id} className="rounded-lg border border-line bg-bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">{b.name}</span>
              {b.headline && (
                <span
                  className="tag whitespace-nowrap"
                  style={
                    b.band
                      ? { background: `${BAND_HEX[b.band]}22`, color: BAND_HEX[b.band] }
                      : { background: "#eef1f6", color: "#475569" }
                  }
                >
                  {b.headline}
                </span>
              )}
            </div>

            {b.metrics?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {b.metrics.map((m, i) => (
                  <span key={i} className="text-xs">
                    <span className="text-slate-500">{m.label}: </span>
                    <span className="font-semibold text-slate-800">{m.value}</span>
                  </span>
                ))}
              </div>
            )}

            {b.list?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {b.list.map((id) => (
                  <span key={id} className="tag bg-bg-elevated font-mono text-[10px] text-accent">
                    {id}
                  </span>
                ))}
              </div>
            )}

            {b.controls?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {b.controls.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span
                      className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: STATUS_HEX[c.status] }}
                      title={c.status}
                    />
                    <span>
                      <span className="font-mono text-accent">{c.control}</span>{" "}
                      <span className="text-slate-600">{c.title}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {b.note && <p className="mt-2 text-xs text-slate-500">{b.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-line bg-bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${accent ? "text-risk-critical" : "text-slate-900"}`}>
        {value}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SectionTitle } from "../components/widgets.jsx";

const CATEGORY_META = {
  immediate: { title: "Immediate", color: "border-risk-critical/40", dot: "bg-risk-critical" },
  short_term: { title: "Short-term", color: "border-risk-medium/40", dot: "bg-risk-medium" },
  medium_term: { title: "Medium-term", color: "border-accent/40", dot: "bg-accent" },
  long_term: { title: "Long-term", color: "border-risk-low/40", dot: "bg-risk-low" },
};

export default function Mitigation() {
  const [params] = useSearchParams();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [plan, setPlan] = useState(null);
  const [impact, setImpact] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => {
        setSuppliers(d.suppliers ?? []);
        const fromUrl = params.get("supplier");
        const id = fromUrl || d.suppliers?.[0]?.supplier_id || "";
        setSupplierId(id);
        if (id) generate(id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const generate = async (id) => {
    setBusy(true);
    setPlan(null);
    try {
      const res = await fetch("/api/mitigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier_id: id, scenario: "ransomware" }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        setImpact(data.impact);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Mitigation Playbook</h1>
          <p className="text-sm text-slate-500">
            Prioritized 4-tier response plan and ranked alternate suppliers
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button onClick={() => generate(supplierId)} disabled={busy || !supplierId} className="btn btn-primary">
            {busy ? "Generating…" : "Generate plan"}
          </button>
        </div>
      </div>

      {impact && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Plants at risk" value={impact.affected_plants} />
          <Metric label="Downtime" value={`${impact.estimated_downtime_days}d`} />
          <Metric label="Revenue at risk" value={impact.revenue_at_risk_usd} accent />
          <Metric label="Confidence" value={impact.confidence} />
        </div>
      )}

      {plan?.ai_summary && (
        <div className="card border-accent/20 bg-accent/5">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-accent">Claude AI briefing</div>
          <p className="text-sm text-slate-200">{plan.ai_summary}</p>
        </div>
      )}

      {busy && !plan && <div className="card py-10 text-center text-sm text-slate-500">Building plan…</div>}

      {plan && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plan.actions.map((a) => {
              const meta = CATEGORY_META[a.category];
              return (
                <div key={a.category} className={`card ${meta.color}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <h3 className="font-semibold text-white">{meta.title}</h3>
                  </div>
                  <div className="text-xs text-slate-500">{a.window}</div>
                  <ul className="mt-3 space-y-2">
                    {a.actions.map((act, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-600" />
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="card">
            <SectionTitle
              title="Alternate Suppliers"
              subtitle="Ranked by similarity: component match · proximity · quality · capacity"
            />
            <div className="space-y-2">
              {plan.alternate_suppliers.length === 0 && (
                <p className="text-sm text-slate-500">No qualified alternates found for these components.</p>
              )}
              {plan.alternate_suppliers.map((alt, idx) => (
                <AltRow key={alt.supplier_id} alt={alt} top={idx === 0} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AltRow({ alt, top }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        top ? "border-risk-low/40 bg-risk-low/5" : "border-line bg-bg-soft"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-100">{alt.name}</span>
          <span className="text-xs text-slate-500">{alt.country}</span>
          {top && <span className="tag bg-risk-low/15 text-risk-low">Best match</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-risk-low">{alt.similarity_score}%</span>
          <span className="text-xs text-slate-500">match</span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 sm:grid-cols-4">
        <Factor label="Component" v={alt.component_category_match} />
        <Factor label="Proximity" v={alt.geographic_proximity} />
        <Factor label="Quality" v={alt.quality_rating} />
        <Factor label="Capacity" v={alt.capacity_availability} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-slate-500">
          Lead time: <span className="text-slate-300">{alt.estimated_lead_time_days} days</span>
        </span>
        <span className="text-slate-500">
          Onboarding: <span className="text-slate-300">{alt.onboarding_effort}</span>
        </span>
        {alt.covers_components.length > 0 && (
          <span className="text-slate-500">
            Covers: <span className="text-slate-300">{alt.covers_components.join(", ")}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Factor({ label, v }) {
  return (
    <div>
      <span className="text-slate-500">{label}</span>
      <div className="mt-0.5 flex items-center gap-1.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-elevated">
          <div className="h-full bg-accent" style={{ width: `${v}%` }} />
        </div>
        <span className="text-slate-400">{v}%</span>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div className="card">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ? "text-risk-critical" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

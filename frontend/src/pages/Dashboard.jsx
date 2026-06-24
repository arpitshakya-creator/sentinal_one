import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RiskBadge, ScoreBar, SectionTitle, Stat } from "../components/widgets.jsx";
import { BAND_HEX, bandFromScore } from "../lib/ui.js";

export default function Dashboard() {
  const [suppliers, setSuppliers] = useState([]);
  const [cves, setCves] = useState([]);
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);

  const load = useCallback(async () => {
    const [s, c, t] = await Promise.all([
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/cves").then((r) => r.json()),
      fetch("/api/threats").then((r) => r.json()),
    ]);
    setSuppliers(s.suppliers ?? []);
    setCves(c.cves ?? []);
    setThreats(t.threats ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshIntel = async () => {
    setIngesting(true);
    try {
      await fetch("/api/ingest", { method: "POST" });
      await load();
    } finally {
      setIngesting(false);
    }
  };

  const stats = useMemo(() => {
    const critical = suppliers.filter((s) => s.band === "critical").length;
    const medium = suppliers.filter((s) => s.band === "medium").length;
    const exploited = suppliers.filter((s) => s.breach_indicator).length;
    return { critical, medium, exploited };
  }, [suppliers]);

  const chartData = suppliers.map((s) => ({
    name: s.name.split(" ")[0],
    score: s.risk_score,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Threat Dashboard</h1>
          <p className="text-sm text-slate-500">
            Helios Motorworks · live supplier cyber-risk posture from NVD &amp; CISA KEV
          </p>
        </div>
        <button onClick={refreshIntel} disabled={ingesting} className="btn btn-primary">
          {ingesting ? (
            <>
              <Spinner /> Pulling live intel…
            </>
          ) : (
            <>Refresh threat intel</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Suppliers monitored" value={suppliers.length} hint="Across Tiers 1–4" accent="accent" />
        <Stat label="Critical risk" value={stats.critical} hint="Score ≥ 70" accent="critical" />
        <Stat label="Medium risk" value={stats.medium} hint="Score 40–69" accent="medium" />
        <Stat
          label="Actively exploited"
          value={stats.exploited}
          hint="Suppliers w/ CISA KEV CVE"
          accent="critical"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <SectionTitle
            title="Supplier Risk Leaderboard"
            subtitle="Composite score: CVSS · breach signal · patch lag · plant connectivity"
          />
          {loading ? (
            <Loading />
          ) : (
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-bg-soft text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Supplier</th>
                    <th className="px-3 py-2">Tier</th>
                    <th className="px-3 py-2">CVEs</th>
                    <th className="px-3 py-2 w-40">Risk</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.supplier_id} className="border-t border-line hover:bg-bg-soft/50">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-100">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.country}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-400">T{s.tier}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-slate-200">{s.open_cve_count}</span>
                        {s.breach_indicator && (
                          <span className="ml-1.5 tag bg-risk-critical/15 text-risk-critical">KEV</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <RiskBadge band={s.band} score={s.risk_score} />
                        </div>
                        <div className="mt-1.5">
                          <ScoreBar score={s.risk_score} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          to={`/simulator?supplier=${s.supplier_id}`}
                          className="btn btn-ghost px-2.5 py-1 text-xs"
                        >
                          Simulate
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && suppliers.length > 0 && (
            <div className="mt-5 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#121a28", border: "1px solid #1e2a3d", borderRadius: 8 }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={BAND_HEX[bandFromScore(d.score)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <SectionTitle title="Threat Feed" subtitle="Actively exploited (CISA KEV) signals" />
            <div className="space-y-2.5">
              {threats.length === 0 && <p className="text-sm text-slate-500">No active threat events.</p>}
              {threats.slice(0, 6).map((t) => (
                <div key={t.event_id} className="rounded-lg border border-line bg-bg-soft p-3">
                  <div className="flex items-center justify-between">
                    <span className="tag bg-risk-critical/15 text-risk-critical">{t.source}</span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(t.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-slate-200">{t.supplier_name}</div>
                  <p className="text-xs text-slate-400">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <SectionTitle
          title="Live CVE Intelligence"
          subtitle="Pulled from the NIST National Vulnerability Database & CISA KEV"
        />
        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {cves.slice(0, 12).map((c) => (
              <a
                key={c.id}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-lg border border-line bg-bg-soft p-3 hover:border-accent/40"
              >
                <span
                  className="mt-0.5 grid h-9 w-12 flex-shrink-0 place-items-center rounded-md text-xs font-bold"
                  style={{
                    background: `${BAND_HEX[c.cvss >= 9 ? "critical" : c.cvss >= 7 ? "medium" : "low"]}22`,
                    color: BAND_HEX[c.cvss >= 9 ? "critical" : c.cvss >= 7 ? "medium" : "low"],
                  }}
                >
                  {Number(c.cvss).toFixed(1)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent">{c.id}</span>
                    {c.known_exploited && (
                      <span className="tag bg-risk-critical/15 text-risk-critical">Exploited</span>
                    )}
                    <span className="text-[11px] text-slate-500">{c.vendor}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-400">{c.description}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function Loading() {
  return <div className="py-10 text-center text-sm text-slate-500">Loading…</div>;
}

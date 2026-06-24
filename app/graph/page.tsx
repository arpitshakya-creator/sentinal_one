"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphNode, GraphEdge, ImpactAssessment, NodeType } from "@/lib/types";
import { BAND_HEX, bandFromScore } from "@/lib/ui";
import { SectionTitle } from "@/components/widgets";

const LAYER_X: Record<NodeType, number> = {
  Manufacturer: 0,
  Supplier: 280,
  Component: 600,
  Product: 900,
  Plant: 1200,
  System: 600,
};

const TYPE_COLOR: Record<NodeType, string> = {
  Manufacturer: "#38bdf8",
  Supplier: "#94a3b8",
  Component: "#a78bfa",
  Product: "#34d399",
  Plant: "#fbbf24",
  System: "#f472b6",
};

function layout(nodes: GraphNode[]): Map<string, { x: number; y: number }> {
  const byType = new Map<NodeType, GraphNode[]>();
  for (const n of nodes) {
    const list = byType.get(n.type) ?? [];
    list.push(n);
    byType.set(n.type, list);
  }
  const pos = new Map<string, { x: number; y: number }>();
  for (const [type, list] of byType) {
    const isSystem = type === "System";
    list.forEach((n, i) => {
      const x = LAYER_X[type];
      const y = isSystem ? 620 + i * 90 : i * 95 + 20;
      pos.set(n.id, { x, y });
    });
  }
  return pos;
}

export default function GraphPage() {
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);
  const [rawEdges, setRawEdges] = useState<GraphEdge[]>([]);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [blast, setBlast] = useState<Set<string>>(new Set());
  const [impact, setImpact] = useState<ImpactAssessment | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d) => {
        setRawNodes(d.nodes ?? []);
        setRawEdges(d.edges ?? []);
      });
  }, []);

  const positions = useMemo(() => layout(rawNodes), [rawNodes]);

  const nodes: Node[] = useMemo(() => {
    return rawNodes.map((n) => {
      const inBlast = blast.has(n.id);
      const isSupplier = n.type === "Supplier";
      const score = Number(n.props.risk_score ?? n.props.base_risk ?? 0);
      const baseColor = isSupplier ? BAND_HEX[bandFromScore(score)] : TYPE_COLOR[n.type];
      const color = inBlast ? "#ef4444" : baseColor;
      const label = isSupplier ? `${n.label}\n(${score})` : n.label;
      return {
        id: n.id,
        position: positions.get(n.id) ?? { x: 0, y: 0 },
        data: { label },
        style: {
          background: inBlast ? "rgba(239,68,68,0.18)" : "#121a28",
          color: "#e2e8f0",
          border: `2px solid ${color}`,
          borderRadius: 10,
          fontSize: 11,
          width: 170,
          padding: 8,
          whiteSpace: "pre-line",
          boxShadow: inBlast ? "0 0 18px rgba(239,68,68,0.55)" : "none",
        },
        className: inBlast ? "animate-pulseRisk" : undefined,
      } as Node;
    });
  }, [rawNodes, positions, blast]);

  const edges: Edge[] = useMemo(() => {
    return rawEdges.map((e, i) => {
      const active = blast.has(e.source) && blast.has(e.target);
      return {
        id: `e${e.id ?? i}`,
        source: e.source,
        target: e.target,
        animated: active,
        style: { stroke: active ? "#ef4444" : "#27364d", strokeWidth: active ? 2.5 : 1 },
        label: e.type,
        labelStyle: { fill: "#64748b", fontSize: 9 },
        labelBgStyle: { fill: "#0a0e14" },
      } as Edge;
    });
  }, [rawEdges, blast]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const found = rawNodes.find((n) => n.id === node.id) ?? null;
      setSelected(found);
    },
    [rawNodes]
  );

  const simulateBreach = async (supplierId: string) => {
    setBusy(true);
    setImpact(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier_id: supplierId, scenario: "ransomware" }),
      });
      const data = await res.json();
      if (data.impact) {
        const set = new Set<string>([supplierId, ...data.impact.blast_radius_nodes]);
        setBlast(set);
        setImpact(data.impact);
      }
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setBlast(new Set());
    setImpact(null);
  };

  const suppliers = rawNodes.filter((n) => n.type === "Supplier");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Supply Chain Graph</h1>
          <p className="text-sm text-slate-500">
            Dependency graph · click a node to inspect · simulate a breach to render the blast radius
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-line bg-bg-elevated px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => e.target.value && simulateBreach(e.target.value)}
          >
            <option value="" disabled>
              Simulate breach…
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({String(s.props.risk_score ?? s.props.base_risk ?? "")})
              </option>
            ))}
          </select>
          {blast.size > 0 && (
            <button onClick={reset} className="btn btn-ghost">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="card h-[640px] p-0 lg:col-span-3">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} color="#1e2a3d" />
            <Controls className="!bg-bg-elevated !border-line" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => (blast.has(n.id) ? "#ef4444" : "#334155")}
              maskColor="rgba(10,14,20,0.7)"
              style={{ background: "#0f1622" }}
            />
          </ReactFlow>
        </div>

        <div className="space-y-4">
          <LegendCard />
          {selected && <InspectCard node={selected} onSimulate={simulateBreach} busy={busy} />}
          {impact && <BlastCard impact={impact} />}
        </div>
      </div>
    </div>
  );
}

function LegendCard() {
  return (
    <div className="card">
      <SectionTitle title="Legend" />
      <div className="space-y-1.5 text-xs">
        {(Object.keys(TYPE_COLOR) as NodeType[]).map((t) => (
          <div key={t} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ background: TYPE_COLOR[t] }} />
            <span className="text-slate-400">{t}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center gap-2 border-t border-line pt-2">
          <span className="h-3 w-3 rounded bg-risk-critical" />
          <span className="text-slate-400">Blast radius (breached)</span>
        </div>
      </div>
    </div>
  );
}

function InspectCard({
  node,
  onSimulate,
  busy,
}: {
  node: GraphNode;
  onSimulate: (id: string) => void;
  busy: boolean;
}) {
  const p = node.props;
  return (
    <div className="card animate-slideUp">
      <div className="text-xs uppercase tracking-wider text-slate-500">{node.type}</div>
      <div className="text-lg font-semibold text-white">{node.label}</div>
      <div className="mt-3 space-y-1 text-sm">
        {node.type === "Supplier" && (
          <>
            <Row k="Tier" v={`T${p.tier}`} />
            <Row k="Country" v={String(p.country)} />
            <Row k="Risk score" v={String(p.risk_score ?? p.base_risk ?? "—")} />
            <Row k="Open CVEs" v={String((p.open_cves as string[])?.length ?? 0)} />
            <Row k="Vendor tech" v={(p.keywords as string[])?.join(", ") ?? "—"} />
          </>
        )}
        {node.type === "Plant" && <Row k="Location" v={String(p.location)} />}
        {node.type === "Plant" && <Row k="ERP" v={String(p.erp_system)} />}
        {node.type === "Product" && <Row k="Daily revenue" v={`$${Number(p.daily_revenue).toLocaleString()}`} />}
        {node.type === "Component" && <Row k="Criticality" v={String(p.criticality)} />}
        {node.type === "System" && <Row k="Type" v={String(p.system_type)} />}
        {node.type === "System" && <Row k="Version" v={String(p.version)} />}
      </div>
      {node.type === "Supplier" && (
        <button
          onClick={() => onSimulate(node.id)}
          disabled={busy}
          className="btn btn-danger mt-3 w-full"
        >
          {busy ? "Simulating…" : "Simulate breach"}
        </button>
      )}
    </div>
  );
}

function BlastCard({ impact }: { impact: ImpactAssessment }) {
  return (
    <div className="card animate-slideUp border-risk-critical/30">
      <SectionTitle title="Blast Radius" subtitle={`Scenario: ${impact.scenario}`} />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Metric k="Plants hit" v={impact.affected_plants} />
        <Metric k="Downtime" v={`${impact.estimated_downtime_days}d`} />
        <Metric k="Revenue at risk" v={impact.revenue_at_risk_usd} accent />
        <Metric k="Confidence" v={impact.confidence} />
      </div>
      <div className="mt-3 text-xs text-slate-400">
        {impact.affected_plant_names.join(", ")}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{k}</span>
      <span className="text-right text-slate-200">{v}</span>
    </div>
  );
}
function Metric({ k, v, accent }: { k: string; v: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-bg-soft p-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{k}</div>
      <div className={`text-base font-semibold ${accent ? "text-risk-critical" : "text-white"}`}>{v}</div>
    </div>
  );
}

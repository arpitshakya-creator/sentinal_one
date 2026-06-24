import { getDb } from "./db";
import type { GraphNode, GraphEdge, BlastNode, NodeType } from "./types";

export interface LoadedGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>; // outgoing edges by source
  edges: GraphEdge[];
}

export async function loadGraph(): Promise<LoadedGraph> {
  const db = await getDb();
  const nodeRes = await db.query<GraphNode>("SELECT id, type, label, props FROM nodes");
  const edgeRes = await db.query<GraphEdge>(
    "SELECT id, source, target, type, props FROM edges"
  );

  const nodes = new Map<string, GraphNode>();
  for (const n of nodeRes.rows) nodes.set(n.id, n);

  const adjacency = new Map<string, GraphEdge[]>();
  for (const e of edgeRes.rows) {
    const list = adjacency.get(e.source) ?? [];
    list.push(e);
    adjacency.set(e.source, list);
  }
  return { nodes, adjacency, edges: edgeRes.rows };
}

const ALERT_THRESHOLD = 10;

/**
 * Weighted Breadth-First Search blast radius from a compromised supplier node.
 * Propagated Risk = Parent Risk x Edge Weight. The BFS terminates along a branch
 * when propagated risk drops below the alert threshold (10).
 */
export function bfsBlastRadius(
  graph: LoadedGraph,
  startId: string,
  sourceRisk: number
): BlastNode[] {
  const best = new Map<string, BlastNode>();
  const queue: { id: string; risk: number; hop: number }[] = [
    { id: startId, risk: sourceRisk, hop: 0 },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const node = graph.nodes.get(cur.id);
    if (!node) continue;

    const existing = best.get(cur.id);
    if (!existing || cur.risk > existing.propagated_risk) {
      best.set(cur.id, {
        id: node.id,
        type: node.type,
        label: node.label,
        hop: cur.hop,
        propagated_risk: Math.round(cur.risk * 10) / 10,
      });
    } else if (cur.id !== startId) {
      // Already reached this node with an equal/greater risk; don't re-expand.
      continue;
    }

    for (const edge of graph.adjacency.get(cur.id) ?? []) {
      const weight = typeof edge.props.weight === "number" ? edge.props.weight : 0.5;
      const propagated = cur.risk * weight;
      if (propagated < ALERT_THRESHOLD) continue;
      const child = best.get(edge.target);
      if (child && child.propagated_risk >= propagated) continue;
      queue.push({ id: edge.target, risk: propagated, hop: cur.hop + 1 });
    }
  }

  best.delete(startId);
  return Array.from(best.values()).sort((a, b) => b.propagated_risk - a.propagated_risk);
}

/** All nodes of a given type reachable downstream from a start node. */
export function reachableByType(
  graph: LoadedGraph,
  startId: string,
  type: NodeType
): GraphNode[] {
  const visited = new Set<string>([startId]);
  const queue = [startId];
  const out: GraphNode[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    for (const edge of graph.adjacency.get(id) ?? []) {
      if (visited.has(edge.target)) continue;
      visited.add(edge.target);
      const node = graph.nodes.get(edge.target);
      if (node?.type === type) out.push(node);
      queue.push(edge.target);
    }
  }
  return out;
}

export async function countReachablePlants(supplierId: string): Promise<number> {
  const graph = await loadGraph();
  return reachableByType(graph, supplierId, "Plant").length;
}

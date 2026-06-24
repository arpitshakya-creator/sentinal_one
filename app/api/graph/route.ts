import { NextResponse } from "next/server";
import { loadGraph } from "@/lib/graph";

export const dynamic = "force-dynamic";

export async function GET() {
  const graph = await loadGraph();
  return NextResponse.json({
    nodes: Array.from(graph.nodes.values()),
    edges: graph.edges,
  });
}

import { supabase } from './supabase';

// Only these types are singleton per project
const SINGLETON_TYPES = ['project', 'summary', 'decision'];

// Default positions per node type — jitter added to avoid overlap
const DEFAULT_POS = {
  project:  { x: 40,  y: 180 },
  prompt:   { x: 260, y: 40  },
  response: { x: 260, y: 200 },
  summary:  { x: 260, y: 360 },
  decision: { x: 500, y: 200 },
};

function jitter(base) {
  return {
    x: base.x + Math.random() * 40,
    y: base.y + Math.random() * 40,
  };
}

// Creates a node.
// Singleton types (project, summary, decision): find-or-create by (project_id, type).
// Other types with refId: dedup by (project_id, type, data.ref_id).
// Other types without refId: always create.
export async function createNode({ projectId, type, data = {}, x, y, refId }) {
  if (!projectId || !type) return null;

  if (SINGLETON_TYPES.includes(type)) {
    const { data: existing } = await supabase
      .from('rl_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type)
      .maybeSingle();
    if (existing) return existing;
  } else if (refId != null) {
    // Dedup by ref_id stored in data column
    const { data: existing } = await supabase
      .from('rl_nodes')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', type);
    const match = existing?.find((n) => n.data?.ref_id === refId);
    if (match) return match;
  }

  const base = DEFAULT_POS[type] || { x: 100, y: 100 };
  const pos = jitter(base);
  const nodeData = refId != null ? { ...data, ref_id: refId } : data;

  const { data: node, error } = await supabase
    .from('rl_nodes')
    .insert({
      project_id: projectId,
      type,
      data: nodeData,
      x: x ?? pos.x,
      y: y ?? pos.y,
    })
    .select()
    .single();

  if (error) { console.warn('Graph createNode failed:', error); return null; }
  return node;
}

// Returns existing edge or creates a new one.
export async function createEdge({ projectId, from, to }) {
  if (!projectId || !from || !to) return null;

  const { data: existing } = await supabase
    .from('rl_edges')
    .select('id')
    .eq('project_id', projectId)
    .eq('from_node', from)
    .eq('to_node', to)
    .maybeSingle();

  if (existing) return existing;

  const { data: edge, error } = await supabase
    .from('rl_edges')
    .insert({ project_id: projectId, from_node: from, to_node: to })
    .select()
    .single();

  if (error) { console.warn('Graph createEdge failed:', error); return null; }
  return edge;
}

export async function getGraph(projectId) {
  if (!projectId) return { nodes: [], edges: [] };

  const [nodesRes, edgesRes] = await Promise.all([
    supabase.from('rl_nodes').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    supabase.from('rl_edges').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
  ]);

  if (nodesRes.error) { console.warn('Graph getGraph nodes failed:', nodesRes.error); return { nodes: [], edges: [] }; }
  if (edgesRes.error) { console.warn('Graph getGraph edges failed:', edgesRes.error); return { nodes: nodesRes.data || [], edges: [] }; }

  return {
    nodes: nodesRes.data || [],
    edges: edgesRes.data || [],
  };
}

export async function updateNodePosition(nodeId, x, y) {
  if (!nodeId) return;
  const { error } = await supabase
    .from('rl_nodes')
    .update({ x, y })
    .eq('id', nodeId);
  if (error) console.error('Failed to save node position:', error);
}

// Returns positions keyed by type as arrays: { type: [{ x, y, nodeId }] }
// Canvas uses the first element per type for its fixed 5-node view.
export function extractPositions(nodes) {
  const positions = {};
  (nodes || []).forEach((n) => {
    if (!positions[n.type]) positions[n.type] = [];
    positions[n.type].push({ x: n.x, y: n.y, nodeId: n.id });
  });
  return positions;
}

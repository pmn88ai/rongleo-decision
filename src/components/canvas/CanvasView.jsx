import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { supabase } from '../../lib/supabase';
import { NodeDetailPanel } from './NodeDetailPanel';
import { useTheme } from '../../theme/ThemeProvider';
import { getGraph, updateNodePosition, extractPositions } from '../../lib/graph';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 110;

const INITIAL_POSITIONS = {
  project:  { x: 40,  y: 180 },
  prompt:   { x: 260, y: 40  },
  response: { x: 260, y: 200 },
  summary:  { x: 260, y: 360 },
  decision: { x: 500, y: 200 },
};

const DraggableNode = memo(function DraggableNode({ id, pos, onDrag, onSelect, color, title, children }) {
  const { theme } = useTheme();
  const dragging = useRef(false);
  const offset   = useRef({ x: 0, y: 0 });
  const moved    = useRef(false);

  const onMouseDown = (e) => {
    dragging.current = true;
    moved.current = false;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      moved.current = true;
      onDrag(id, { x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onMouseUp = () => {
      if (dragging.current && !moved.current) onSelect && onSelect(id);
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [id, onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: NODE_WIDTH, minHeight: NODE_HEIGHT,
        border: `2px solid ${color}`,
        background: theme.card,
        color: theme.text,
        padding: '8px', cursor: 'grab', userSelect: 'none',
        boxSizing: 'border-box', fontSize: '12px', fontFamily: 'monospace',
        borderRadius: '6px',
        transition: 'background 0.25s',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '6px', color, borderBottom: `1px solid ${color}`, paddingBottom: '4px' }}>
        {title}
      </div>
      {children}
    </div>
  );
});

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function centerOf(pos) {
  return { x: pos.x + NODE_WIDTH / 2, y: pos.y + NODE_HEIGHT / 2 };
}

function Arrow({ from, to }) {
  const { theme } = useTheme();
  const f = centerOf(from);
  const t = centerOf(to);
  const dx = t.x - f.x;
  const dy = t.y - f.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const startX = f.x + ux * (NODE_WIDTH / 2);
  const startY = f.y + uy * (NODE_HEIGHT / 2);
  const endX = t.x - ux * (NODE_WIDTH / 2 + 8);
  const endY = t.y - uy * (NODE_HEIGHT / 2 + 8);
  const markerId = `arrow-${Math.round(from.x)}-${Math.round(from.y)}-${Math.round(to.x)}-${Math.round(to.y)}`;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={theme.subtext} />
        </marker>
      </defs>
      <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={theme.border} strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
    </svg>
  );
}

export function CanvasView({ project, promptCount, prompts, responses, summary, decision, showToast, onSummaryUpdated, onDecisionUpdated, savedPositions }) {
  const { theme } = useTheme();
  const [positions, setPositions] = useState({ ...INITIAL_POSITIONS });
  const [selectedNode, setSelectedNode] = useState(null);
  const saveTimer = useRef({});

  // Apply saved positions from DB when they arrive (savedPositions is now { type: [{x,y,nodeId}] })
  useEffect(() => {
    if (!savedPositions || Object.keys(savedPositions).length === 0) return;
    setPositions((prev) => {
      const merged = { ...prev };
      Object.entries(savedPositions).forEach(([type, arr]) => {
        const pos = Array.isArray(arr) ? arr[0] : arr;
        if (merged[type] && pos) merged[type] = { x: pos.x, y: pos.y };
      });
      return merged;
    });
  }, [savedPositions]);

  const handleDrag = useCallback((id, newPos) => {
    const clamped = { x: clamp(newPos.x, 0, 2000), y: clamp(newPos.y, 0, 1200) };
    setPositions((prev) => ({ ...prev, [id]: clamped }));

    // Debounce save position to DB
    const arr = savedPositions?.[id];
    const nodeId = Array.isArray(arr) ? arr[0]?.nodeId : arr?.nodeId;
    if (nodeId) {
      clearTimeout(saveTimer.current[id]);
      saveTimer.current[id] = setTimeout(() => {
        updateNodePosition(nodeId, clamped.x, clamped.y);
      }, 300);
    }
  }, [savedPositions]);

  const handleSelect = useCallback((id) => {
    if (!project) return;
    setSelectedNode((prev) => (prev === id ? null : id));
  }, [project]);

  useEffect(() => { setSelectedNode(null); }, [project?.id]);

  const truncate = (str, n) => {
    if (!str) return '—';
    const s = String(str);
    return s.length > n ? s.slice(0, n) + '...' : s;
  };

  const CONNECTIONS = [
    ['project', 'prompt'],
    ['project', 'response'],
    ['response', 'summary'],
    ['summary', 'decision'],
  ];

  return (
    <>
      <div
        style={{ position: 'relative', width: '100%', minHeight: '560px', height: '100%', background: theme.bg, border: `1px solid ${theme.border}`, overflow: 'hidden', transition: 'background 0.25s' }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedNode(null); }}
      >
        {CONNECTIONS.map(([a, b]) => (
          <Arrow key={`${a}-${b}`} from={positions[a]} to={positions[b]} />
        ))}

        <DraggableNode id="project" pos={positions.project} onDrag={handleDrag} onSelect={handleSelect} color="#2563eb" title="📁 DỰ ÁN">
          <div style={{ color: theme.text }}><strong>{truncate(project?.name, 22)}</strong></div>
          <div style={{ color: theme.subtext, marginTop: '4px' }}>{truncate(project?.input, 50)}</div>
        </DraggableNode>

        <DraggableNode id="prompt" pos={positions.prompt} onDrag={handleDrag} onSelect={handleSelect} color="#7c3aed" title="💡 PROMPT">
          <div style={{ color: theme.text }}>{promptCount > 0 ? `${promptCount} prompt template` : 'Chưa có prompt'}</div>
        </DraggableNode>

        <DraggableNode id="response" pos={positions.response} onDrag={handleDrag} onSelect={handleSelect} color="#059669" title="🤖 PHẢN HỒI AI">
          <div style={{ color: theme.text }}>{responses && responses.length > 0 ? `${responses.length} phản hồi` : 'Chưa có phản hồi'}</div>
          {responses && responses[0] && (
            <div style={{ color: theme.subtext, marginTop: '4px' }}>{truncate(responses[0].source, 24)}</div>
          )}
        </DraggableNode>

        <DraggableNode id="summary" pos={positions.summary} onDrag={handleDrag} onSelect={handleSelect} color="#d97706" title="📝 TỔNG HỢP">
          <div style={{ color: theme.text }}>{truncate(summary?.content, 80)}</div>
        </DraggableNode>

        <DraggableNode id="decision" pos={positions.decision} onDrag={handleDrag} onSelect={handleSelect} color="#dc2626" title="⚖️ QUYẾT ĐỊNH">
          <div style={{ color: theme.text }}>{truncate(decision?.verdict, 80)}</div>
          {decision && <div style={{ color: theme.subtext, marginTop: '4px', fontSize: '11px' }}>{new Date(decision.created_at).toLocaleDateString('vi-VN')}</div>}
        </DraggableNode>
      </div>

      <NodeDetailPanel
        node={selectedNode}
        project={project}
        prompts={prompts}
        responses={responses}
        summary={summary}
        decision={decision}
        onClose={() => setSelectedNode(null)}
        showToast={showToast}
        onProjectUpdated={() => {}}
        onSummaryUpdated={(s) => onSummaryUpdated && onSummaryUpdated(s)}
        onDecisionUpdated={(d) => onDecisionUpdated && onDecisionUpdated(d)}
      />
    </>
  );
}

export function CanvasViewConnected({ project, promptCount, prompts, showToast }) {
  const [responses, setResponses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [decision, setDecision] = useState(null);
  const [savedPositions, setSavedPositions] = useState({});

  useEffect(() => {
    if (!project?.id) { setResponses([]); setSummary(null); setDecision(null); setSavedPositions({}); return; }
    const load = async () => {
      try {
        const [rRes, sRes, dRes, graph] = await Promise.all([
          supabase.from('rl_responses').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
          supabase.from('rl_summaries').select('*').eq('project_id', project.id).order('created_at', { ascending: false }).limit(1),
          supabase.from('rl_decisions').select('*').eq('project_id', project.id).order('created_at', { ascending: false }).limit(1),
          getGraph(project.id).catch(() => ({ nodes: [], edges: [] })),
        ]);
        if (rRes.error) throw rRes.error;
        if (sRes.error) throw sRes.error;
        if (dRes.error) throw dRes.error;
        setResponses(rRes.data || []);
        setSummary(sRes.data?.[0] || null);
        setDecision(dRes.data?.[0] || null);
        setSavedPositions(extractPositions(graph.nodes));
      } catch (err) {
        console.error('CanvasView load error:', err);
      }
    };
    load();
  }, [project?.id]);

  return (
    <CanvasView
      project={project}
      promptCount={promptCount}
      prompts={prompts}
      responses={responses}
      summary={summary}
      decision={decision}
      showToast={showToast}
      onSummaryUpdated={setSummary}
      onDecisionUpdated={setDecision}
      savedPositions={savedPositions}
    />
  );
}

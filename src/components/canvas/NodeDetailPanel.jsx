import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeProvider';

const tr = (str, n = 200) => {
  if (!str) return '—';
  const s = String(str);
  return s.length > n ? s.slice(0, n) + '...' : s;
};

function EditableField({ label, value, multiline, onSave, showToast }) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const ref = useRef(null);

  useEffect(() => { if (!editing) setStatus(null); }, [editing]);

  const start = () => { setDraft(value || ''); setEditing(true); setTimeout(() => ref.current && ref.current.focus(), 0); };
  const cancel = () => setEditing(false);

  const save = async () => {
    if (!draft.trim()) return;
    if (draft === value) { cancel(); return; }
    setSaving(true); setStatus('saving');
    try {
      await onSave(draft);
      setStatus('success');
      setTimeout(() => { showToast && showToast('Đã lưu', 'success'); }, 0);
      setTimeout(() => setStatus(null), 1500);
      setEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
      setStatus('error');
      setTimeout(() => { showToast && showToast('Lỗi khi lưu', 'error'); }, 0);
      setDraft(value || '');
      setTimeout(() => setStatus(null), 1500);
      setEditing(false);
    } finally { setSaving(false); }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { cancel(); e.stopPropagation(); }
    if (!multiline && e.key === 'Enter') { e.preventDefault(); save(); }
  };

  const borderColor = status === 'saving' ? '#d97706' : status === 'success' ? theme.success : status === 'error' ? theme.danger : theme.border;
  const inputStyle = {
    width: '100%', fontFamily: 'monospace', fontSize: '12px', boxSizing: 'border-box',
    border: `2px solid ${borderColor}`, borderRadius: '4px', padding: '4px 6px',
    background: theme.inputBg, color: theme.text,
    opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'text',
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <strong style={{ color: theme.text }}>{label}:</strong>
      {editing ? (
        <div style={{ marginTop: '4px' }}>
          {multiline ? (
            <textarea ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} onClick={(e) => e.stopPropagation()} rows={5} style={inputStyle} disabled={saving} />
          ) : (
            <input ref={ref} type="text" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} onClick={(e) => e.stopPropagation()} style={inputStyle} disabled={saving} />
          )}
          <div style={{ marginTop: '4px' }}>
            <button onClick={save} disabled={saving} style={{ marginRight: '6px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px' }}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button onClick={cancel} disabled={saving} style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px' }}>Huỷ</button>
          </div>
        </div>
      ) : (
        <div
          onClick={start}
          title="Click để sửa"
          style={{ whiteSpace: 'pre-wrap', marginTop: '4px', color: theme.text, cursor: 'text', borderBottom: `1px dashed ${theme.border}`, paddingBottom: '2px' }}
        >
          {value || '—'}
        </div>
      )}
    </div>
  );
}

function Section({ label, value }) {
  const { theme } = useTheme();
  const display = typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : (value || '—');
  return (
    <div style={{ marginTop: '12px' }}>
      <strong style={{ color: theme.text }}>{label}:</strong>
      <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', color: theme.subtext }}>{display}</div>
    </div>
  );
}

function ProjectDetail({ project, onUpdated, showToast }) {
  const save = (field) => async (value) => {
    if (!project?.id) return;
    const { error } = await supabase.from('rl_projects').update({ [field]: value }).eq('id', project.id);
    if (error) throw error;
    onUpdated && onUpdated({ ...project, [field]: value });
  };
  return (
    <>
      <EditableField label="Tên dự án" value={project?.name} multiline={false} onSave={save('name')} showToast={showToast} />
      <EditableField label="Ý tưởng" value={project?.input} multiline={true} onSave={save('input')} showToast={showToast} />
      <Section label="project_id" value={project?.id} />
    </>
  );
}

function PromptDetail({ prompts }) {
  const { theme } = useTheme();
  if (!prompts || prompts.length === 0) return <p style={{ color: theme.subtext }}>Chưa có prompt nào.</p>;
  return (
    <>
      <p style={{ color: theme.text }}><strong>Tổng số:</strong> {prompts.length} prompt</p>
      <ul style={{ paddingLeft: '16px' }}>
        {prompts.map((p, i) => (
          <li key={p.id || `${p.name}-${i}`} style={{ marginTop: '6px' }}>
            <strong style={{ color: theme.text }}>{p.name}</strong>
            <div style={{ color: theme.subtext, fontSize: '11px', marginTop: '2px' }}>{tr(p.template, 80)}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ResponseItem({ r, onUpdated, showToast }) {
  const { theme } = useTheme();
  const save = (field) => async (value) => {
    const { error } = await supabase.from('rl_responses').update({ [field]: value }).eq('id', r.id);
    if (error) throw error;
    onUpdated && onUpdated({ ...r, [field]: value });
  };
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '8px', marginTop: '8px', background: theme.bg }}>
      <EditableField label="Nguồn" value={r.source} multiline={false} onSave={save('source')} showToast={showToast} />
      <EditableField label="Nội dung" value={r.content} multiline={true} onSave={save('content')} showToast={showToast} />
      <small style={{ color: theme.subtext }}>{r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : ''}</small>
    </div>
  );
}

function ResponseDetail({ responses, onResponseUpdated, showToast }) {
  const { theme } = useTheme();
  const [local, setLocal] = useState(responses || []);
  useEffect(() => { setLocal(responses || []); }, [responses]);
  if (!local || local.length === 0) return <p style={{ color: theme.subtext }}>Chưa có phản hồi nào.</p>;
  const handleUpdated = (updated) => {
    setLocal((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    onResponseUpdated && onResponseUpdated(updated);
  };
  return (
    <>
      <p style={{ color: theme.text }}><strong>Tổng số:</strong> {local.length} phản hồi</p>
      {local.length > 10 && <small style={{ color: theme.subtext }}>Chỉ hiển thị 10 phản hồi đầu</small>}
      {local.slice(0, 10).map((r, i) => (
        <ResponseItem key={r.id || `${r.source}-${i}`} r={r} onUpdated={handleUpdated} showToast={showToast} />
      ))}
    </>
  );
}

function SummaryDetail({ summary, onUpdated, showToast }) {
  const { theme } = useTheme();
  if (!summary) return <p style={{ color: theme.subtext }}>Chưa có tổng hợp.</p>;
  const save = async (value) => {
    if (!summary?.id) return;
    const { error } = await supabase.from('rl_summaries').update({ content: value }).eq('id', summary.id);
    if (error) throw error;
    onUpdated && onUpdated({ ...summary, content: value });
  };
  return (
    <>
      <EditableField label="Nội dung" value={summary.content} multiline={true} onSave={save} showToast={showToast} />
      <small style={{ color: theme.subtext }}>{summary.created_at ? new Date(summary.created_at).toLocaleString('vi-VN') : ''}</small>
    </>
  );
}

function DecisionDetail({ decision, onUpdated, showToast }) {
  const { theme } = useTheme();
  if (!decision) return <p style={{ color: theme.subtext }}>Chưa có quyết định.</p>;
  const save = (field) => async (value) => {
    if (!decision?.id) return;
    const { error } = await supabase.from('rl_decisions').update({ [field]: value }).eq('id', decision.id);
    if (error) throw error;
    onUpdated && onUpdated({ ...decision, [field]: value });
  };
  return (
    <>
      <EditableField label="Quyết định" value={decision.verdict} multiline={false} onSave={save('verdict')} showToast={showToast} />
      <EditableField label="Rủi ro" value={decision.risk} multiline={true} onSave={save('risk')} showToast={showToast} />
      <EditableField label="Hành động" value={decision.action} multiline={true} onSave={save('action')} showToast={showToast} />
      <small style={{ color: theme.subtext }}>{decision.created_at ? new Date(decision.created_at).toLocaleString('vi-VN') : ''}</small>
    </>
  );
}

const NODE_TITLES = {
  project:  '📁 DỰ ÁN',
  prompt:   '💡 PROMPT',
  response: '🤖 PHẢN HỒI AI',
  summary:  '📝 TỔNG HỢP',
  decision: '⚖️ QUYẾT ĐỊNH',
};

export function NodeDetailPanel({ node, project, prompts, responses, summary, decision, onClose, onProjectUpdated, onSummaryUpdated, onDecisionUpdated, showToast }) {
  const { theme } = useTheme();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!node) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, width: '320px', height: '100vh',
        background: theme.card, borderLeft: `2px solid ${theme.border}`,
        color: theme.text, padding: '16px', overflowY: 'auto',
        zIndex: 1000, fontFamily: 'monospace', fontSize: '13px', boxSizing: 'border-box',
        transition: 'background 0.25s, border-color 0.25s',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>
        <strong style={{ color: theme.text }}>{NODE_TITLES[node] || node}</strong>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: theme.subtext }}>✕</button>
      </div>
      <small style={{ color: theme.subtext }}>Click vào text để sửa</small>

      {node === 'project'  && <ProjectDetail project={project} onUpdated={onProjectUpdated} showToast={showToast} />}
      {node === 'prompt'   && <PromptDetail prompts={prompts} />}
      {node === 'response' && <ResponseDetail responses={responses} showToast={showToast} />}
      {node === 'summary'  && <SummaryDetail summary={summary} onUpdated={onSummaryUpdated} showToast={showToast} />}
      {node === 'decision' && <DecisionDetail decision={decision} onUpdated={onDecisionUpdated} showToast={showToast} />}
    </div>
  );
}

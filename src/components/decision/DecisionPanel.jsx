import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateDecision } from '../../lib/decision';
import { useTheme } from '../../theme/ThemeProvider';
import { createNode, createEdge } from '../../lib/graph';

export function DecisionPanel({ projectId, onCreated, canDecide = true, showToast }) {
  const { theme } = useTheme();
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    setDecision(null);
    setError('');
    setLoading(false);
    const load = async () => {
      try {
        const { data, error: err } = await supabase
          .from('rl_decisions')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (err) throw err;
        if (data && data.length > 0) setDecision(data[0]);
      } catch (err) {
        console.error('Error loading decision:', err);
      }
    };
    load();
  }, [projectId]);

  const handleGenerate = async () => {
    if (!projectId) return;

    // Hard block
    if (!canDecide) {
      showToast && showToast('Cần tổng hợp trước', 'error');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data: summaries, error: summaryError } = await supabase
        .from('rl_summaries')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (summaryError) throw summaryError;

      if (!summaries || summaries.length === 0) {
        setError('Chưa có tổng hợp. Hãy chạy Tổng hợp Groq trước.');
        showToast && showToast('Cần tổng hợp trước', 'error');
        return;
      }

      if (!summaries[0].content) {
        setError('Nội dung tổng hợp trống.');
        return;
      }

      const result = await generateDecision(summaries[0].content);

      const { data: inserted, error: insertError } = await supabase
        .from('rl_decisions')
        .insert({
          project_id: projectId,
          verdict: result.verdict,
          risk: result.risk,
          action: result.action,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setDecision(inserted);

      // Graph: create decision node, link from summary node
      ;(async () => {
        try {
          const [summaryNode, decisionNode] = await Promise.all([
            createNode({ projectId, type: 'summary', data: {} }),
            createNode({ projectId, type: 'decision', data: { ref_id: inserted.id, label: result.verdict } }),
          ]);
          if (summaryNode && decisionNode) {
            await createEdge({ projectId, from: summaryNode.id, to: decisionNode.id });
          }
        } catch (err) {
          console.warn('Graph decision node failed (non-critical):', err);
        }
      })();

      onCreated && onCreated();
    } catch (err) {
      console.error('Error generating decision:', err);
      setError('Tạo quyết định thất bại: ' + err.message);
      showToast && showToast('Tạo quyết định thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) return null;

  const btnDisabled = loading || !canDecide;

  return (
    <div style={{ marginTop: '12px', fontFamily: 'monospace' }}>
      <div title={!canDecide ? 'Cần tổng hợp trước' : undefined}>
        <button
          onClick={handleGenerate}
          disabled={btnDisabled}
          style={{
            width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
            cursor: btnDisabled ? 'not-allowed' : 'pointer',
            fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
            background: btnDisabled ? theme.border : theme.danger,
            color: btnDisabled ? theme.subtext : '#fff',
            opacity: loading ? 0.6 : 1,
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Đang tạo...' : 'Tạo quyết định'}
        </button>
        {!canDecide && (
          <p style={{ fontSize: '11px', color: theme.subtext, marginTop: '5px', textAlign: 'center' }}>
            Cần tổng hợp trước
          </p>
        )}
      </div>

      {error && <p style={{ color: theme.danger, fontSize: '12px', marginTop: '8px' }}>{error}</p>}

      {decision && (
        <div style={{
          marginTop: '12px', background: theme.bg,
          border: `1px solid ${theme.border}`, padding: '12px',
          borderRadius: '8px', color: theme.text, fontSize: '12px',
        }}>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: theme.text }}>Quyết định:</strong> {decision.verdict}</p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: theme.text }}>Rủi ro:</strong><br /><span style={{ whiteSpace: 'pre-wrap', color: theme.subtext }}>{decision.risk}</span></p>
          <p style={{ margin: '0 0 8px' }}><strong style={{ color: theme.text }}>Hành động:</strong><br /><span style={{ whiteSpace: 'pre-wrap', color: theme.subtext }}>{decision.action}</span></p>
          <small style={{ color: theme.subtext }}>Tạo lúc: {new Date(decision.created_at).toLocaleString('vi-VN')}</small>
        </div>
      )}
    </div>
  );
}

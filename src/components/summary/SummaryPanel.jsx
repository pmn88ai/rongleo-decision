import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { summarizeResponses } from '../../lib/groq';
import { useTheme } from '../../theme/ThemeProvider';
import { createNode, createEdge } from '../../lib/graph';

export function SummaryPanel({ projectId, onCreated, canSummarize = true, showToast }) {
  const { theme } = useTheme();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    setSummary('');
    setError('');
    setLoading(false);
    const load = async () => {
      try {
        const { data, error: err } = await supabase
          .from('rl_summaries')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (err) throw err;
        if (data && data.length > 0) setSummary(data[0].content);
        else setSummary('');
      } catch (err) {
        console.error('Error loading summary:', err);
      }
    };
    load();
  }, [projectId]);

  const handleSummarize = async () => {
    if (!projectId) return;

    // Hard block
    if (!canSummarize) {
      showToast && showToast('Cần ít nhất 2 phản hồi', 'error');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data: responses, error: fetchError } = await supabase
        .from('rl_responses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!responses || responses.length < 2) {
        setError('Cần ít nhất 2 phản hồi để tổng hợp.');
        showToast && showToast('Cần ít nhất 2 phản hồi', 'error');
        return;
      }

      const result = await summarizeResponses(responses);

      const { data: insertedSummary, error: insertError } = await supabase
        .from('rl_summaries')
        .insert({ project_id: projectId, content: result })
        .select()
        .single();

      if (insertError) throw insertError;

      setSummary(result);

      // Graph: create summary node, create edges from ALL response nodes
      ;(async () => {
        try {
          const [{ data: responseNodes }, summaryNode] = await Promise.all([
            supabase.from('rl_nodes').select('*').eq('project_id', projectId).eq('type', 'response'),
            createNode({ projectId, type: 'summary', data: { ref_id: insertedSummary.id, label: 'summary', preview: result.slice(0, 120) } }),
          ]);
          if (summaryNode && responseNodes?.length) {
            await Promise.all(
              responseNodes.map((r) => createEdge({ projectId, from: r.id, to: summaryNode.id }))
            );
          }
        } catch (err) {
          console.warn('Graph summary node failed (non-critical):', err);
        }
      })();

      onCreated && onCreated();
    } catch (err) {
      console.error('Error summarizing:', err);
      setError('Tổng hợp thất bại. Vui lòng thử lại.');
      showToast && showToast('Tổng hợp thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!projectId) return null;

  const btnDisabled = loading || !canSummarize;

  return (
    <div style={{ marginTop: '12px', fontFamily: 'monospace' }}>
      <div title={!canSummarize ? 'Cần ít nhất 2 phản hồi' : undefined}>
        <button
          onClick={handleSummarize}
          disabled={btnDisabled}
          style={{
            width: '100%', padding: '9px', borderRadius: '8px', border: 'none',
            cursor: btnDisabled ? 'not-allowed' : 'pointer',
            fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
            background: btnDisabled ? theme.border : theme.primary,
            color: btnDisabled ? theme.subtext : '#fff',
            opacity: loading ? 0.6 : 1,
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Đang tổng hợp...' : 'Tổng hợp bằng Groq'}
        </button>
        {!canSummarize && (
          <p style={{ fontSize: '11px', color: theme.subtext, marginTop: '5px', textAlign: 'center' }}>
            Cần ít nhất 2 phản hồi
          </p>
        )}
      </div>

      {error && <p style={{ color: theme.danger, fontSize: '12px', marginTop: '8px' }}>{error}</p>}

      {summary && (
        <div style={{
          marginTop: '12px', whiteSpace: 'pre-wrap',
          background: theme.bg, border: `1px solid ${theme.border}`,
          padding: '12px', borderRadius: '8px',
          color: theme.text, fontSize: '12px', lineHeight: '1.6',
        }}>
          {summary}
        </div>
      )}
    </div>
  );
}

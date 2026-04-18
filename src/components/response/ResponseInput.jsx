import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeProvider';
import { createNode, createEdge } from '../../lib/graph';

export function ResponseInput({ projectId, onCreated, disabled = false, disabledReason = '' }) {
  const { theme } = useTheme();
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) { setError(disabledReason || 'Không thể thêm lúc này'); return; }
    if (!projectId) { setError('Chưa chọn dự án'); return; }
    if (!content.trim()) { setError('Nội dung phản hồi là bắt buộc'); return; }
    setLoading(true);
    setError('');
    try {
      const trimmedSource = source.trim() || 'Không rõ';
      const trimmedContent = content.trim();
      const { data: inserted, error: supabaseError } = await supabase
        .from('rl_responses')
        .insert({ project_id: projectId, source: trimmedSource, content: trimmedContent })
        .select()
        .single();
      if (supabaseError) throw supabaseError;

      // Graph: create response node (keyed by ref_id), link from prompt nodes
      ;(async () => {
        try {
          const { data: promptNodes } = await supabase
            .from('rl_nodes').select('*').eq('project_id', projectId).eq('type', 'prompt');
          const responseNode = await createNode({
            projectId, type: 'response',
            data: { ref_id: inserted.id, label: trimmedSource, preview: trimmedContent.slice(0, 120) },
            refId: inserted.id,
          });
          if (responseNode && promptNodes?.length) {
            await Promise.all(
              promptNodes.map((pn) => createEdge({ projectId, from: pn.id, to: responseNode.id }))
            );
          }
        } catch (err) {
          console.warn('Graph response node failed (non-critical):', err);
        }
      })();

      setSource('');
      setContent('');
      onCreated && onCreated();
    } catch (err) {
      console.error('Error creating response:', err);
      setError('Lưu phản hồi thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = disabled || loading;

  const inputStyle = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '6px 8px', marginTop: '4px',
    border: `1px solid ${theme.border}`, borderRadius: '5px',
    fontFamily: 'monospace', fontSize: '12px',
    background: isBlocked ? theme.bg : theme.inputBg,
    color: theme.text,
    opacity: isBlocked ? 0.5 : 1,
    cursor: isBlocked ? 'not-allowed' : 'text',
    transition: 'background 0.2s, opacity 0.2s',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '12px', fontFamily: 'monospace' }}>
      {disabled && disabledReason && (
        <div style={{
          padding: '8px 12px', marginBottom: '8px',
          background: theme.bg, border: `1px dashed ${theme.border}`,
          borderRadius: '6px', color: theme.subtext, fontSize: '11px',
        }}>
          {disabledReason}
        </div>
      )}

      <div>
        <label style={{ fontSize: '11px', color: theme.subtext }}>Nguồn AI (ChatGPT, Grok...):</label>
        <input
          type="text"
          value={source}
          onChange={(e) => { setSource(e.target.value); setError(''); }}
          placeholder="VD: ChatGPT, Grok, Gemini"
          disabled={isBlocked}
          style={inputStyle}
        />
      </div>

      <div style={{ marginTop: '8px' }}>
        <label style={{ fontSize: '11px', color: theme.subtext }}>Nội dung phản hồi:</label>
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setError(''); }}
          placeholder={disabled ? disabledReason || 'Chọn prompt trước' : 'Dán nội dung phản hồi từ AI vào đây...'}
          rows={6}
          required
          disabled={isBlocked}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {error && <p style={{ color: theme.danger, fontSize: '12px', margin: '6px 0' }}>{error}</p>}

      <button
        type="submit"
        disabled={isBlocked}
        style={{
          marginTop: '8px', width: '100%', padding: '8px',
          borderRadius: '7px', border: 'none',
          background: isBlocked ? theme.border : theme.success,
          color: isBlocked ? theme.subtext : '#fff',
          cursor: isBlocked ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px',
          opacity: loading ? 0.6 : 1,
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Đang lưu...' : 'Lưu phản hồi'}
      </button>
    </form>
  );
}

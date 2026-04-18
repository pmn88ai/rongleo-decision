import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { createNode } from '../../lib/graph';
import { useTheme } from '../../theme/ThemeProvider';

export function ProjectForm({ onCreated }) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !input.trim()) {
      setError('Tên dự án và ý tưởng là bắt buộc');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: created, error: supabaseError } = await supabase
        .from('rl_projects')
        .insert({ name: name.trim(), input: input.trim(), user_id: 'RongLeo' })
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      // Create project node in graph (non-critical)
      createNode({
        projectId: created.id,
        type: 'project',
        data: { ref_id: created.id, label: created.name },
      }).catch((err) => console.warn('Graph node create failed:', err));

      setName('');
      setInput('');
      onCreated && onCreated(created);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Tạo dự án thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: '6px', fontFamily: 'monospace',
    fontSize: '14px', border: `1px solid ${theme.border}`,
    background: loading ? theme.bg : theme.inputBg,
    color: theme.text, opacity: loading ? 0.6 : 1,
    transition: 'border-color 0.2s, background 0.2s',
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'monospace' }}>
      <div>
        <label style={{ fontSize: '11px', color: theme.subtext, display: 'block', marginBottom: '4px' }}>Tên dự án</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên dự án"
          required
          disabled={loading}
          style={fieldStyle}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <label style={{ fontSize: '11px', color: theme.subtext, display: 'block', marginBottom: '4px' }}>Ý tưởng / câu hỏi cần phân tích</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mô tả ý tưởng chi tiết..."
          required
          disabled={loading}
          style={{ ...fieldStyle, minHeight: '140px', resize: 'vertical', lineHeight: '1.6' }}
        />
      </div>
      {error && <p style={{ color: theme.danger, fontSize: '12px', margin: '6px 0 0' }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: '12px', width: '100%', padding: '10px 16px',
          borderRadius: '8px', border: 'none',
          background: loading ? theme.border : theme.primary,
          color: loading ? theme.subtext : '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px',
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Đang tạo...' : 'Tạo dự án'}
      </button>
    </form>
  );
}

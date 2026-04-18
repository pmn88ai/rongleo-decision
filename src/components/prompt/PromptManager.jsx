/*
  SQL to create table (run in Supabase SQL editor):

  create table rl_prompts (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    template text not null,
    created_at timestamp with time zone default now()
  );
*/

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeProvider';

export function PromptManager({ onPromptsChanged }) {
  const { theme } = useTheme();

  // Theme-derived styles (inside component — depend on theme)
  const BTN = {
    padding: '4px 10px', borderRadius: '5px', border: `1px solid ${theme.border}`,
    cursor: 'pointer', fontSize: '11px', background: theme.bg,
    color: theme.text, fontFamily: 'monospace',
  };
  const BTN_PRIMARY = {
    ...BTN, background: theme.primary, color: '#fff',
    border: 'none', padding: '5px 12px',
  };
  const BTN_DANGER = {
    ...BTN, color: theme.danger, border: `1px solid ${theme.danger}40`,
    background: theme.bg,
  };
  const inputStyle = {
    display: 'block', width: '100%', marginTop: '4px', padding: '6px 8px',
    border: `1px solid ${theme.border}`, borderRadius: '5px', fontSize: '12px',
    fontFamily: 'monospace', boxSizing: 'border-box',
    background: theme.inputBg, color: theme.text,
  };

  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addTemplate, setAddTemplate] = useState('');

  const [expandedId, setExpandedId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTemplate, setEditTemplate] = useState('');

  const fetchPrompts = async () => {
    try {
      const { data, error: err } = await supabase
        .from('rl_prompts').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setPrompts(data || []);
      onPromptsChanged && onPromptsChanged(data || []);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Tải prompt thất bại');
    }
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addName.trim() || !addTemplate.trim()) { setError('Tên và template là bắt buộc'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.from('rl_prompts')
        .insert({ name: addName.trim(), template: addTemplate.trim() });
      if (err) throw err;
      setAddName(''); setAddTemplate(''); setShowAddForm(false);
      await fetchPrompts();
    } catch (err) {
      console.error(err);
      setError('Thêm prompt thất bại');
    } finally { setLoading(false); }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim() || !editTemplate.trim()) { setError('Tên và template là bắt buộc'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.from('rl_prompts')
        .update({ name: editName.trim(), template: editTemplate.trim() }).eq('id', id);
      if (err) throw err;
      setEditingId(null);
      await fetchPrompts();
    } catch (err) {
      console.error(err);
      setError('Cập nhật prompt thất bại');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá prompt này?')) return;
    try {
      const { error: err } = await supabase.from('rl_prompts').delete().eq('id', id);
      if (err) throw err;
      if (expandedId === id) setExpandedId(null);
      if (editingId === id) setEditingId(null);
      await fetchPrompts();
    } catch (err) {
      console.error(err);
      setError('Xoá prompt thất bại');
    }
  };

  const startEdit = (p, e) => {
    e.stopPropagation();
    setEditingId(p.id);
    setEditName(p.name);
    setEditTemplate(p.template);
    setExpandedId(p.id);
    setError('');
  };

  const cancelEdit = () => { setEditingId(null); setEditName(''); setEditTemplate(''); setError(''); };

  const filtered = prompts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (editingId && !filtered.find((p) => p.id === editingId)) {
      setEditingId(null);
    }
  }, [search]);

  const labelStyle = { fontSize: '10px', color: theme.subtext, textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ marginTop: '12px', fontFamily: 'monospace' }}>

      {/* Search + Add row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="🔍 Tìm prompt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, marginTop: 0, flex: 1 }}
        />
        <button
          style={BTN_PRIMARY}
          onClick={() => { setShowAddForm(!showAddForm); setError(''); }}
        >
          {showAddForm ? '✕ Đóng' : '+ Thêm mới'}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '12px', marginBottom: '12px' }}
        >
          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Tên prompt</label>
            <input
              type="text" value={addName}
              onChange={(e) => { setAddName(e.target.value); setError(''); }}
              placeholder="VD: Phân tích SWOT"
              disabled={loading} style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={labelStyle}>Template (dùng {'{{input}}'})</label>
            <textarea
              value={addTemplate}
              onChange={(e) => { setAddTemplate(e.target.value); setError(''); }}
              placeholder="Hãy phân tích... {{input}}"
              rows={4} disabled={loading}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          {error && <p style={{ color: theme.danger, fontSize: '12px', margin: '0 0 8px' }}>{error}</p>}
          <button type="submit" disabled={loading} style={BTN_PRIMARY}>
            {loading ? 'Đang lưu...' : 'Thêm prompt'}
          </button>
        </form>
      )}

      {error && !showAddForm && !editingId && (
        <p style={{ color: theme.danger, fontSize: '12px', margin: '0 0 8px' }}>{error}</p>
      )}

      {/* Count */}
      <div style={{ fontSize: '11px', color: theme.subtext, marginBottom: '8px' }}>
        {filtered.length} / {prompts.length} prompt
      </div>

      {/* Accordion list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: theme.subtext, fontSize: '12px' }}>
          {search ? 'Không tìm thấy prompt phù hợp.' : 'Chưa có prompt nào.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filtered.map((p) => {
            const isExpanded = expandedId === p.id;
            const isEditing  = editingId === p.id;
            return (
              <div key={p.id} style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', overflow: 'hidden', background: theme.card, transition: 'background 0.25s, border-color 0.25s' }}>

                {/* Row header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '9px 12px',
                    cursor: 'pointer', userSelect: 'none',
                    background: isExpanded ? theme.bg : theme.card,
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 'bold', fontSize: '12px', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button style={BTN} onClick={(e) => startEdit(p, e)}>Sửa</button>
                    <button style={BTN_DANGER} onClick={() => handleDelete(p.id)}>Xoá</button>
                  </div>
                  <span style={{ marginLeft: '8px', color: theme.subtext, fontSize: '10px' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div style={{ padding: '12px', borderTop: `1px solid ${theme.border}` }}>
                    {isEditing ? (
                      <div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={labelStyle}>Tên</label>
                          <input
                            type="text" value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={loading} style={inputStyle}
                          />
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <label style={labelStyle}>Template</label>
                          <textarea
                            value={editTemplate}
                            onChange={(e) => setEditTemplate(e.target.value)}
                            rows={6} disabled={loading}
                            style={{ ...inputStyle, resize: 'vertical' }}
                          />
                        </div>
                        {error && editingId === p.id && (
                          <p style={{ color: theme.danger, fontSize: '12px', margin: '0 0 8px' }}>{error}</p>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={BTN_PRIMARY} onClick={() => handleUpdate(p.id)} disabled={loading}>
                            {loading ? '...' : 'Lưu'}
                          </button>
                          <button style={BTN} onClick={cancelEdit}>Huỷ</button>
                        </div>
                      </div>
                    ) : (
                      <pre style={{
                        fontSize: '12px', color: theme.text, whiteSpace: 'pre-wrap', margin: 0,
                        fontFamily: 'monospace', background: theme.bg, padding: '10px',
                        borderRadius: '6px', lineHeight: '1.6',
                      }}>
                        {p.template}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

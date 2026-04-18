import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectForm } from '../components/project/ProjectForm';
import { useTheme } from '../theme/ThemeProvider';

export function MainLayout({ activeProject, setActiveProject, children, onSettings, showToast, refreshKey }) {
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', input: '' });
  const [saving, setSaving] = useState(false);

  const S = {
    root:          { display: 'flex', height: '100vh', fontFamily: 'monospace', fontSize: '13px', overflow: 'hidden', background: theme.bg, transition: 'background 0.25s' },
    sidebar:       { width: '240px', minWidth: '240px', borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', background: theme.card, overflow: 'hidden', transition: 'background 0.25s, border-color 0.25s' },
    sidebarHeader: { padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    sidebarTitle:  { fontWeight: 'bold', fontSize: '14px', color: theme.text },
    sidebarBody:   { flex: 1, overflowY: 'auto', padding: '8px' },
    sidebarFooter: { borderTop: `1px solid ${theme.border}`, padding: '8px' },
    projectItem:   (active) => ({
      padding: '8px 10px', marginBottom: '4px', borderRadius: '6px',
      background: active ? theme.border : 'transparent',
      border: active ? `1px solid ${theme.border}` : '1px solid transparent',
      transition: 'background 0.15s',
    }),
    projectName: { fontWeight: 'bold', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.text },
    projectMeta: { fontSize: '11px', color: theme.subtext, marginTop: '2px' },
    main:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    btn:         { width: '100%', padding: '6px', background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px' },
    smallBtn:    (bg, color) => ({
      padding: '2px 7px', fontSize: '10px', borderRadius: '4px', border: 'none',
      background: bg, color, cursor: 'pointer', fontFamily: 'monospace',
    }),
    input: {
      width: '100%', boxSizing: 'border-box', padding: '4px 6px',
      fontFamily: 'monospace', fontSize: '11px', borderRadius: '4px',
      border: `1px solid ${theme.border}`, background: theme.inputBg,
      color: theme.text, marginBottom: '4px',
    },
  };

  const fetchProjects = async (mounted) => {
    try {
      const { data, error } = await supabase
        .from('rl_projects').select('*').order('created_at', { ascending: false });
      if (!mounted.current) return;
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    fetchProjects(mounted);
    return () => { mounted.current = false; };
  }, [refreshKey]);

  const handleCreated = () => {
    setShowForm(false);
    const mounted = { current: true };
    fetchProjects(mounted);
  };

  const startEdit = (e, p) => {
    e.stopPropagation();
    setEditingId(p.id);
    setEditDraft({ name: p.name || '', input: p.input || '' });
  };

  const cancelEdit = (e) => {
    e && e.stopPropagation();
    setEditingId(null);
  };

  const handleSave = async (e, p) => {
    e.stopPropagation();
    if (!editDraft.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rl_projects')
        .update({ name: editDraft.name.trim(), input: editDraft.input.trim() })
        .eq('id', p.id);
      if (error) throw error;
      if (activeProject?.id === p.id) {
        setActiveProject({ ...p, name: editDraft.name.trim(), input: editDraft.input.trim() });
      }
      setEditingId(null);
      const mounted = { current: true };
      await fetchProjects(mounted);
      showToast && showToast('Đã cập nhật dự án', 'success');
    } catch (err) {
      console.error('Update error:', err);
      showToast && showToast('Lỗi khi cập nhật', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, p) => {
    e.stopPropagation();
    if (!confirm(`Xóa dự án "${p.name}"?`)) return;
    try {
      const { error } = await supabase.from('rl_projects').delete().eq('id', p.id);
      if (error) throw error;
      if (activeProject?.id === p.id) setActiveProject(null);
      const mounted = { current: true };
      await fetchProjects(mounted);
      showToast && showToast('Đã xóa dự án', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast && showToast('Lỗi khi xóa', 'error');
    }
  };

  return (
    <div style={S.root}>
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <span style={S.sidebarTitle}>RongLeo</span>
          <button onClick={onSettings} title="Cài đặt" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>⚙️</button>
        </div>

        <div style={S.sidebarBody}>
          {loading && <p style={{ color: theme.subtext, fontSize: '11px' }}>Đang tải...</p>}
          {!loading && projects.length === 0 && <p style={{ color: theme.subtext, fontSize: '11px' }}>Chưa có dự án.</p>}
          {projects.map((p) => {
            const isActive = activeProject?.id === p.id;
            const isEditing = editingId === p.id;

            if (isEditing) {
              return (
                <div key={p.id} style={{ ...S.projectItem(isActive), padding: '8px 10px', marginBottom: '4px' }}>
                  <input
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Tên dự án"
                    style={S.input}
                    autoFocus
                  />
                  <textarea
                    value={editDraft.input}
                    onChange={(e) => setEditDraft((d) => ({ ...d, input: e.target.value }))}
                    placeholder="Ý tưởng..."
                    rows={3}
                    style={{ ...S.input, resize: 'vertical', marginBottom: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => handleSave(e, p)}
                      disabled={saving || !editDraft.name.trim()}
                      style={{ ...S.smallBtn(theme.primary, '#fff'), flex: 1, opacity: saving ? 0.6 : 1 }}
                    >
                      {saving ? '...' : 'Lưu'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      style={S.smallBtn(theme.bg, theme.text)}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={p.id}
                style={{ ...S.projectItem(isActive), cursor: 'pointer' }}
                onClick={() => setActiveProject(p)}
              >
                <div style={S.projectName}>{p.name}</div>
                <div style={S.projectMeta}>{p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : ''}</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => startEdit(e, p)} style={S.smallBtn(theme.bg, theme.text)}>
                    ✏️ Sửa
                  </button>
                  <button onClick={(e) => handleDelete(e, p)} style={S.smallBtn(theme.bg, theme.danger)}>
                    🗑 Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={S.sidebarFooter}>
          {showForm ? (
            <div>
              <ProjectForm onCreated={handleCreated} />
              <button onClick={() => setShowForm(false)} style={{ ...S.btn, marginTop: '6px' }}>Huỷ</button>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} style={S.btn}>+ Tạo dự án</button>
          )}
        </div>
      </div>

      <div style={S.main}>{children}</div>
    </div>
  );
}

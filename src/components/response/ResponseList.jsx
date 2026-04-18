import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function ResponseList({ projectId, refresh }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResponses = async () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('rl_responses').select('*').eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (supabaseError) throw supabaseError;
      setResponses(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching responses:', err);
      setError('Tải phản hồi thất bại');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    fetchResponses();
  }, [projectId, refresh]);

  if (!projectId) return null;

  if (loading) return (
    <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', padding: '12px 0' }}>
      Đang tải...
    </p>
  );

  if (error) return <p style={{ color: '#dc2626', fontSize: '12px' }}>{error}</p>;

  if (responses.length === 0) return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '4px' }}>
        Chưa có phản hồi nào
      </div>
      <div style={{ fontSize: '11px' }}>Dán kết quả AI vào ô trên để bắt đầu</div>
    </div>
  );

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>
        {responses.length} phản hồi
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {responses.map((r) => (
          <div key={r.id || `${r.source}-${r.created_at}`} style={{
            border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px',
            background: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{
                fontWeight: 'bold', fontSize: '11px', color: '#374151',
                background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px',
              }}>
                {r.source}
              </span>
              <small style={{ color: '#9ca3af', fontSize: '10px' }}>
                {r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '—'}
              </small>
            </div>
            <p style={{
              whiteSpace: 'pre-wrap', margin: 0, fontSize: '12px', color: '#4b5563',
              lineHeight: '1.6', maxHeight: '120px', overflowY: 'auto',
            }}>
              {r.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

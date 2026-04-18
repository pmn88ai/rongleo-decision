import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PromptManager } from '../components/prompt/PromptManager';
import { ConfigPanel } from '../components/config/ConfigPanel';
import { useTheme } from '../theme/ThemeProvider';

export function Settings({ onBack }) {
  const { theme } = useTheme();
  const [supabaseStatus, setSupabaseStatus] = useState('Đang kiểm tra...');
  const [loading, setLoading] = useState(false);

  const checkSupabase = async () => {
    setLoading(true);
    setSupabaseStatus('Đang kiểm tra...');
    try {
      const { error } = await supabase.from('rl_projects').select('id').limit(1);
      setSupabaseStatus(error ? 'FAIL — ' + error.message : 'OK ✓');
    } catch (err) {
      setSupabaseStatus('FAIL — ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkSupabase(); }, []);

  const card = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    transition: 'background 0.25s, border-color 0.25s',
  };

  const statusColor = supabaseStatus.startsWith('OK')
    ? theme.success
    : supabaseStatus.startsWith('Đang')
    ? theme.subtext
    : theme.danger;

  return (
    <div style={{ padding: '20px', maxWidth: '700px', fontFamily: 'monospace', background: theme.bg, minHeight: '100vh', color: theme.text, transition: 'background 0.25s, color 0.25s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: theme.card, border: `1px solid ${theme.border}`,
            color: theme.text, cursor: 'pointer', padding: '4px 10px',
            borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px',
          }}
        >
          ← Quay lại
        </button>
        <h2 style={{ margin: 0, color: theme.text }}>⚙️ Cài đặt</h2>
      </div>

      <div style={card}>
        <strong style={{ color: theme.text }}>Kết nối Supabase</strong>
        <p style={{ margin: '8px 0', color: statusColor }}>{supabaseStatus}</p>
        <button
          onClick={checkSupabase}
          disabled={loading}
          style={{
            padding: '5px 12px', borderRadius: '5px',
            border: `1px solid ${theme.border}`, background: theme.bg,
            color: theme.text, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'monospace', fontSize: '12px', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
        </button>
      </div>

      <div style={card}>
        <ConfigPanel />
      </div>

      <div style={card}>
        <strong style={{ color: theme.text }}>Thư viện Prompt</strong>
        <PromptManager />
      </div>
    </div>
  );
}

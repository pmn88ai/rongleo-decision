import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeProvider';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export function StatusBar() {
  const { mode } = useTheme();
  const [supabaseOk, setSupabaseOk] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const { data, error } = await Promise.race([
          supabase.from('rl_projects').select('id').limit(1),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 2000)
          )
        ]);
        setSupabaseOk(!error && !!data);
      } catch {
        setSupabaseOk(false);
      }
    };
    check();
  }, []);

  const dot = (ok) => (
    <span style={{ color: ok ? '#34d399' : ok === false ? '#f87171' : '#6b7280', fontWeight: 'bold' }}>
      {ok === null ? '...' : ok ? '●' : '●'}
    </span>
  );

  // Status bar is intentionally always dark (terminal-style)
  const bg = mode === 'dark' ? '#0d1117' : '#1a1a2e';

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: bg, color: '#9ca3af', fontFamily: 'monospace', fontSize: '11px', padding: '3px 12px', display: 'flex', gap: '16px', zIndex: 900, transition: 'background 0.25s' }}>
      <span>{dot(supabaseOk)} Supabase: {supabaseOk === null ? '...' : supabaseOk ? 'OK' : 'FAIL'}</span>
      <span>{dot(!!GROQ_API_KEY)} Groq: {GROQ_API_KEY ? 'OK' : 'FAIL'}</span>
    </div>
  );
}

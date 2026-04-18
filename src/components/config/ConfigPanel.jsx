import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeProvider';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export function ConfigPanel() {
  const { theme } = useTheme();
  const [supabaseStatus, setSupabaseStatus] = useState('Đang kiểm tra...');
  const [groqStatus, setGroqStatus] = useState(GROQ_API_KEY ? 'OK' : 'FAIL — thiếu VITE_GROQ_API_KEY');

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { error } = await supabase.from('rl_projects').select('id').limit(1);
        setSupabaseStatus(error ? 'FAIL — ' + error.message : 'OK');
      } catch (err) {
        setSupabaseStatus('FAIL — ' + err.message);
      }
    };
    checkSupabase();
  }, []);

  const okColor   = theme.success;
  const failColor = theme.danger;
  const pendColor = theme.subtext;

  return (
    <div style={{ border: `1px solid ${theme.border}`, padding: '12px', marginTop: '12px', borderRadius: '6px', background: theme.bg, transition: 'background 0.25s, border-color 0.25s' }}>
      <strong style={{ color: theme.text }}>=== CẤU HÌNH HỆ THỐNG ===</strong>
      <p style={{ color: theme.text, margin: '8px 0' }}>
        Supabase:{' '}
        <span style={{ color: supabaseStatus === 'OK' ? okColor : supabaseStatus.startsWith('Đang') ? pendColor : failColor }}>
          {supabaseStatus}
        </span>
      </p>
      <p style={{ color: theme.text, margin: '8px 0' }}>
        Groq:{' '}
        <span style={{ color: groqStatus === 'OK' ? okColor : failColor }}>{groqStatus}</span>
        <br />
        <small style={{ color: theme.subtext }}>(chỉ kiểm tra key tồn tại, không verify API)</small>
      </p>
      <p style={{ color: theme.text, margin: '8px 0' }}>
        Model: <code style={{ background: theme.card, color: theme.text, padding: '1px 5px', borderRadius: '3px' }}>llama-3.1-8b-instant</code>
      </p>
    </div>
  );
}

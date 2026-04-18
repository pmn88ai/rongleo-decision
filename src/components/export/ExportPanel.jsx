import { useState } from 'react';
import { exportProjectData } from '../../lib/export';
import { useTheme } from '../../theme/ThemeProvider';

export function ExportPanel({ projectId }) {
  const { theme } = useTheme();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    if (!projectId) return;
    setError(''); setCopied(false); setLoading(true);
    try {
      const data = await exportProjectData(projectId);
      setJsonText(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Export error:', err);
      setError('Export thất bại: ' + err.message);
    } finally { setLoading(false); }
  };

  const handleCopy = async () => {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      setError('Copy thất bại.');
    }
  };

  const handleDownload = () => {
    if (!jsonText) return;
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const btn = {
    padding: '5px 12px', borderRadius: '5px', border: `1px solid ${theme.border}`,
    background: theme.bg, color: theme.text, cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '12px', opacity: loading ? 0.6 : 1,
  };

  if (!projectId) return null;

  return (
    <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button onClick={handleExport} disabled={loading} style={btn}>
          {loading ? 'Đang tải...' : 'Export JSON'}
        </button>
        {jsonText && (
          <>
            <button onClick={handleCopy} disabled={!jsonText} style={{ ...btn, background: copied ? theme.success : theme.bg, color: copied ? '#fff' : theme.text }}>
              {copied ? '✓ Đã copy!' : 'Copy JSON'}
            </button>
            <button onClick={handleDownload} disabled={!jsonText} style={btn}>Tải file .json</button>
          </>
        )}
      </div>
      {error && <p style={{ color: theme.danger, fontSize: '12px', marginTop: '6px' }}>{error}</p>}
      {jsonText && (
        <textarea
          readOnly
          value={jsonText}
          rows={14}
          style={{
            width: '100%', marginTop: '10px', fontFamily: 'monospace', fontSize: '11px',
            background: theme.codeBg, color: theme.text, border: `1px solid ${theme.border}`,
            borderRadius: '6px', padding: '8px', boxSizing: 'border-box', resize: 'vertical',
          }}
        />
      )}
    </div>
  );
}

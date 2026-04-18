import { useTheme } from '../../theme/ThemeProvider';

export function ToastContainer({ toasts }) {
  const { theme } = useTheme();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#fff',
            background: t.type === 'error' ? theme.danger : theme.success,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            whiteSpace: 'pre-wrap',
            maxWidth: '300px',
            textAlign: 'center',
            pointerEvents: 'auto',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

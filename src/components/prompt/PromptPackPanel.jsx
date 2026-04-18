import { useState, useEffect } from 'react';
import { generatePromptPack } from '../../lib/prompt';
import { useTheme } from '../../theme/ThemeProvider';
import { createNode, createEdge } from '../../lib/graph';

export function PromptPackPanel({ prompts, selectedIds, projectInput, showToast, projectId }) {
  const { theme } = useTheme();
  const [pack, setPack] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setPack([]); }, [selectedIds, projectInput, prompts]);

  useEffect(() => { setCopiedAll(false); }, [pack]);

  const hasSelection = selectedIds && selectedIds.length > 0;

  const handleGenerate = () => {
    setError('');
    if (!hasSelection) { setError('Chưa chọn prompt nào.'); return; }
    if (!projectInput || !projectInput.trim()) { setError('Dự án chưa có nội dung ý tưởng.'); return; }
    const selected = prompts.filter((p) => selectedIds.includes(p.id));
    try {
      const result = generatePromptPack(selected, projectInput);
      setPack(result);

      // Graph: one node per prompt template (singleton by ref_id), linked from project node
      if (projectId) {
        (async () => {
          try {
            const projectNode = await createNode({ projectId, type: 'project', data: { ref_id: projectId, label: 'project' } });
            await Promise.all(
              selected.map(async (p) => {
                const promptNode = await createNode({
                  projectId, type: 'prompt',
                  data: { ref_id: p.id, label: p.name },
                  refId: p.id,
                });
                if (projectNode && promptNode) {
                  await createEdge({ projectId, from: projectNode.id, to: promptNode.id });
                }
              })
            );
          } catch (err) {
            console.warn('Graph prompt node failed (non-critical):', err);
          }
        })();
      }
    } catch (err) {
      console.error('Generate error:', err);
      setError('Tạo prompt pack thất bại: ' + err.message);
    }
  };

  const handleCopyOne = async (index, name, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      showToast && showToast(`Đã copy: ${name}`, 'success');
    } catch (err) {
      console.error('Copy error:', err);
      showToast && showToast('Copy thất bại', 'error');
    }
  };

  const handleCopyAll = async () => {
    if (!pack.length) return;
    const text = pack
      .map((item, i) => `=== PROMPT ${i + 1}: ${item.name} ===\n${item.content}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      showToast && showToast('Đã copy toàn bộ Prompt Pack', 'success');
    } catch (err) {
      console.error('Copy all error:', err);
      showToast && showToast('Copy thất bại', 'error');
    }
  };

  const btnBase = {
    padding: '9px 14px', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold',
    fontSize: '12px', transition: 'background 0.15s, opacity 0.15s',
  };

  return (
    <div style={{ marginTop: '12px', fontFamily: 'monospace' }}>
      <button
        onClick={handleGenerate}
        disabled={!hasSelection}
        style={{
          ...btnBase,
          width: '100%',
          background: hasSelection ? theme.primary : theme.border,
          color: hasSelection ? '#fff' : theme.subtext,
          opacity: hasSelection ? 1 : 0.7,
          cursor: hasSelection ? 'pointer' : 'not-allowed',
        }}
      >
        ▶ Tạo Prompt Pack {hasSelection ? `(${selectedIds.length})` : ''}
      </button>

      {!hasSelection && (
        <p style={{ fontSize: '11px', color: theme.subtext, marginTop: '6px', textAlign: 'center' }}>
          👉 Hãy chọn ít nhất 1 prompt
        </p>
      )}

      {error && <p style={{ color: theme.danger, fontSize: '12px', marginTop: '8px' }}>{error}</p>}

      {pack.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {/* Copy ALL button */}
          <button
            onClick={handleCopyAll}
            style={{
              ...btnBase,
              width: '100%', marginBottom: '10px',
              background: copiedAll ? theme.success : theme.bg,
              color: copiedAll ? '#fff' : theme.text,
              border: `1px solid ${copiedAll ? theme.success : theme.border}`,
            }}
          >
            {copiedAll ? '✓ Đã copy tất cả!' : '🔘 Copy ALL Prompt Pack'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pack.map((item, i) => (
              <div
                key={item.name + i}
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: theme.card,
                }}
              >
                {/* Prompt header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: theme.bg,
                  borderBottom: `1px solid ${theme.border}`,
                }}>
                  <div>
                    <span style={{ fontSize: '10px', color: theme.subtext, marginRight: '6px' }}>
                      #{i + 1}
                    </span>
                    <strong style={{ fontSize: '12px', color: theme.text }}>{item.name}</strong>
                  </div>
                  <button
                    onClick={() => handleCopyOne(i, item.name, item.content)}
                    style={{
                      ...btnBase,
                      padding: '4px 12px', fontSize: '11px',
                      background: copiedIndex === i ? theme.success : theme.primary,
                      color: '#fff',
                    }}
                  >
                    {copiedIndex === i ? '✓ Đã copy!' : 'Copy'}
                  </button>
                </div>

                {/* Prompt content */}
                <pre style={{
                  margin: 0, padding: '10px 12px',
                  fontSize: '12px', color: theme.text,
                  whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.7',
                  background: theme.card, maxHeight: '240px', overflowY: 'auto',
                }}>
                  {item.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

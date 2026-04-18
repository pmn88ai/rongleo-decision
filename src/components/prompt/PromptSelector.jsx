import { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

const CATEGORY_MAP = {
  idea:     ['Brainwriting', 'Idea Spurring', 'Trigger Words', 'Worst Possible Idea'],
  analysis: ['SWOT Analysis', 'Assumptions', 'SCAMPER'],
  risk:     ['Six Thinking Hats', 'Scenarios'],
  decision: ['Questioning', 'Rolestorming', 'Analogy Thinking'],
};

const CATEGORY_LABEL = {
  idea:     '💡 Ý tưởng',
  analysis: '🔍 Phân tích',
  risk:     '⚠️ Rủi ro',
  decision: '⚡ Quyết định',
  other:    '📦 Khác',
};

const PROMPT_META = {
  'Brainwriting':          { vi: 'Viết càng nhiều ý tưởng càng tốt',           en: 'Generate as many ideas as possible' },
  'Idea Spurring':         { vi: 'Phát triển từ ý tưởng gốc',                   en: 'Expand from a seed idea' },
  'Trigger Words':         { vi: 'Dùng từ kích hoạt để mở rộng suy nghĩ',       en: 'Spark new thinking with trigger words' },
  'Worst Possible Idea':   { vi: 'Nghĩ ý tưởng tệ nhất để tìm giải pháp',      en: 'Brainstorm worst cases to reveal solutions' },
  'SWOT Analysis':         { vi: 'Điểm mạnh, yếu, cơ hội, thách thức',          en: 'Strengths, Weaknesses, Opportunities, Threats' },
  'Assumptions':           { vi: 'Kiểm tra các giả định ẩn',                    en: 'Challenge hidden assumptions' },
  'SCAMPER':               { vi: 'Biến đổi ý tưởng theo 7 chiều',               en: 'Substitute, Combine, Adapt, Modify, Eliminate...' },
  'Six Thinking Hats':     { vi: 'Nhìn vấn đề từ 6 góc độ khác nhau',           en: 'Analyze from 6 different perspectives' },
  'Scenarios':             { vi: 'Tạo các kịch bản tương lai khác nhau',        en: 'Create alternative future scenarios' },
  'Questioning':           { vi: 'Đặt câu hỏi để khám phá vấn đề sâu hơn',     en: 'Use questions to explore the problem' },
  'Rolestorming':          { vi: 'Đặt mình vào vai nhân vật khác',              en: "Think from another person's role" },
  'Analogy Thinking':      { vi: 'Tìm giải pháp qua phép tương đồng',           en: 'Solve problems through analogies' },
  'Mind Mapping':          { vi: 'Sơ đồ tư duy phân nhánh',                     en: 'Branch out ideas visually' },
  'Reverse Brainstorming': { vi: 'Tìm cách làm hỏng để tìm cách làm đúng',     en: 'Find failures to discover solutions' },
};

const CATEGORY_ORDER = ['idea', 'analysis', 'risk', 'decision', 'other'];

function getCategoryKey(name) {
  for (const [key, names] of Object.entries(CATEGORY_MAP)) {
    if (names.includes(name)) return key;
  }
  return 'other';
}

export function PromptSelector({ prompts, selectedIds, onSelectionChange, disabled = false, disabledReason = '' }) {
  const { theme } = useTheme();
  const [openGroups, setOpenGroups] = useState(() => new Set([CATEGORY_ORDER[0]]));

  useEffect(() => {
    setOpenGroups(new Set([CATEGORY_ORDER[0]]));
  }, [prompts]);

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...new Set([...selectedIds, id])]);
    }
  };

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (!prompts || prompts.length === 0) return null;

  if (disabled) {
    return (
      <div style={{
        marginTop: '8px', padding: '10px 12px',
        border: `1px dashed ${theme.border}`, borderRadius: '8px',
        background: theme.bg, color: theme.subtext, fontSize: '11px',
        opacity: 0.7,
      }}>
        {disabledReason || 'Không khả dụng'}
      </div>
    );
  }

  // Dedupe by name
  const uniqueMap = new Map();
  prompts.forEach((p) => { if (!uniqueMap.has(p.name)) uniqueMap.set(p.name, p); });

  const grouped = {};
  CATEGORY_ORDER.forEach((k) => { grouped[k] = []; });
  uniqueMap.forEach((p) => {
    const key = CATEGORY_ORDER.includes(p.category) ? p.category : getCategoryKey(p.name);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
      {selectedIds.length > 0 ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: theme.selectedBg, color: theme.primary,
          borderRadius: '20px', padding: '3px 10px',
          fontSize: '11px', fontWeight: 'bold', marginBottom: '10px',
          border: `1px solid ${theme.selectedBorder}`,
        }}>
          ✓ Đã chọn {selectedIds.length} prompt
        </div>
      ) : (
        <div style={{
          fontSize: '11px', color: theme.subtext, marginBottom: '10px',
          padding: '4px 8px', borderRadius: '6px',
          border: `1px dashed ${theme.border}`, background: theme.bg,
        }}>
          👉 Hãy chọn ít nhất 1 prompt
        </div>
      )}

      {CATEGORY_ORDER.map((key) => {
        const items = grouped[key];
        if (!items || items.length === 0) return null;
        const isOpen = openGroups.has(key);
        const selectedInGroup = items.filter((p) => selectedIds.includes(p.id)).length;
        const label = CATEGORY_LABEL[key] || key;

        return (
          <div
            key={key}
            style={{
              marginBottom: '6px',
              border: `1px solid ${theme.border}`,
              borderRadius: '10px',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Group header */}
            <div
              onClick={() => toggleGroup(key)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 12px', cursor: 'pointer', userSelect: 'none',
                background: isOpen ? theme.bg : theme.card,
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '12px', color: theme.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {label}
                {selectedInGroup > 0 && (
                  <span style={{
                    background: theme.primary, color: '#fff',
                    borderRadius: '10px', padding: '1px 7px', fontSize: '10px',
                  }}>
                    {selectedInGroup}
                  </span>
                )}
              </span>
              <span style={{ color: theme.subtext, fontSize: '10px' }}>
                {items.length} &nbsp; {isOpen ? '▲' : '▼'}
              </span>
            </div>

            {/* Prompt cards */}
            {isOpen && (
              <div style={{ padding: '6px 8px', background: theme.card, borderTop: `1px solid ${theme.border}` }}>
                {items.map((p) => {
                  const meta = PROMPT_META[p.name];
                  const vi = p.description_vi || meta?.vi || 'Chưa có mô tả';
                  const en = p.description_en || meta?.en || '';
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        border: `1px solid ${isSelected ? theme.selectedBorder : theme.border}`,
                        borderRadius: '10px', padding: '10px 12px', marginBottom: '5px',
                        cursor: 'pointer',
                        background: isSelected ? theme.selectedBg : theme.bg,
                        transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
                        boxShadow: isSelected ? `0 0 0 2px ${theme.selectedBorder}40` : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); toggle(p.id); }}
                        style={{ marginTop: '3px', flexShrink: 0, accentColor: theme.primary }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: theme.text }}>{p.name}</div>
                        {vi && (
                          <div style={{ fontSize: '11px', color: theme.subtext, marginTop: '3px', lineHeight: '1.4' }}>{vi}</div>
                        )}
                        {en && (
                          <div style={{ fontSize: '10px', color: theme.subtext, marginTop: '1px', opacity: 0.7, fontStyle: 'italic' }}>{en}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

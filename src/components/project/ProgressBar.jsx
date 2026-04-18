import { useState, Fragment } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

const STEPS = [
  { key: 'idea',     label: 'Idea',     icon: '💡', tooltip: 'Dự án có tên và nội dung ý tưởng' },
  { key: 'prompt',   label: 'Prompt',   icon: '📝', tooltip: 'Đã chọn ít nhất 1 prompt' },
  { key: 'response', label: 'Response', icon: '💬', tooltip: 'Có ít nhất 1 phản hồi AI' },
  { key: 'summary',  label: 'Summary',  icon: '📊', tooltip: 'Đã tổng hợp bằng Groq' },
  { key: 'decision', label: 'Decision', icon: '⚡', tooltip: 'Đã tạo quyết định cuối cùng' },
];

export function ProgressBar({ stepIndex = 0, hint, onStepClick }) {
  const { theme } = useTheme();
  const [hoveredStep, setHoveredStep] = useState(null);
  const allDone = stepIndex >= STEPS.length;

  return (
    <div style={{ padding: '10px 16px 8px', background: theme.card, borderBottom: `1px solid ${theme.border}`, fontFamily: 'monospace', flexShrink: 0, transition: 'background 0.25s, border-color 0.25s' }}>
      {/* overflow: visible ensures tooltips are not clipped */}
      <div style={{ display: 'flex', alignItems: 'flex-start', overflow: 'visible' }}>
        {STEPS.map((step, i) => {
          const isDone   = i < stepIndex || allDone;
          const isActive = i === stepIndex && !allDone;

          return (
            <Fragment key={step.key}>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer', minWidth: '36px' }}
                onClick={() => onStepClick && onStepClick(step.key)}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Circle */}
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? '12px' : '11px',
                  background: isDone ? theme.success : isActive ? theme.primary : theme.border,
                  color: (isDone || isActive) ? '#fff' : theme.subtext,
                  border: isActive ? `2px solid ${theme.primary}` : '2px solid transparent',
                  transition: 'background 0.25s, border-color 0.25s',
                  boxShadow: isActive ? `0 0 0 3px ${theme.primary}26` : 'none',
                }}>
                  {isDone ? '✓' : step.icon}
                </div>

                {/* Label */}
                <div style={{
                  fontSize: '9px', marginTop: '3px', whiteSpace: 'nowrap',
                  color: isDone ? theme.success : isActive ? theme.primary : theme.subtext,
                  fontWeight: isActive ? 'bold' : 'normal',
                  transition: 'color 0.25s',
                }}>
                  {step.label}
                </div>

                {/* Tooltip */}
                {hoveredStep === i && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1f2937', color: '#f3f4f6', borderRadius: '5px',
                    padding: '4px 8px', fontSize: '10px', whiteSpace: 'nowrap',
                    zIndex: 200, pointerEvents: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}>
                    {step.tooltip}
                  </div>
                )}
              </div>

              {/* Connector — marginTop:12 centers against the 26px circle */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', minWidth: '12px', marginTop: '12px',
                  background: (i < stepIndex || allDone) ? theme.success : theme.border,
                  transition: 'background 0.3s',
                }} />
              )}
            </Fragment>
          );
        })}
      </div>

      {hint && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: theme.subtext, textAlign: 'center', lineHeight: '1.4' }}>
          {hint}
        </div>
      )}
    </div>
  );
}

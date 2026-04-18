import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeProvider';
import { getWorkflowState } from '../lib/workflow';
import { ResponseInput } from '../components/response/ResponseInput';
import { ResponseList } from '../components/response/ResponseList';
import { SummaryPanel } from '../components/summary/SummaryPanel';
import { DecisionPanel } from '../components/decision/DecisionPanel';
import { ExportPanel } from '../components/export/ExportPanel';
import { PromptSelector } from '../components/prompt/PromptSelector';
import { PromptPackPanel } from '../components/prompt/PromptPackPanel';
import { ProgressBar } from '../components/project/ProgressBar';

function computeStepIndex({ project, selectedPromptIds, responseCount, hasSummary, hasDecision, decisionComplete }) {
  if (!project?.name) return 0;
  if (!project?.input?.trim()) return 1;
  if (!selectedPromptIds?.length) return 1;
  if (!responseCount) return 2;
  if (!hasSummary) return 3;
  if (!hasDecision) return 4;
  if (!decisionComplete) return 4;
  return 5;
}

function computeHint(stepIndex, responseCount) {
  if (stepIndex === 1) return '👉 Chọn ít nhất 1 prompt để tạo Prompt Pack';
  if (stepIndex === 2) return '👉 Dán ít nhất 1 kết quả từ AI để tiếp tục';
  if (stepIndex === 3) {
    if (responseCount < 2) return '👉 Cần ít nhất 2 phản hồi, rồi nhấn "Tổng hợp bằng Groq"';
    return '👉 Nhấn "Tổng hợp bằng Groq" để tiếp tục';
  }
  if (stepIndex === 4) return '👉 Nhấn "Tạo quyết định" để hoàn thành';
  if (stepIndex >= 5) return '✅ Dự án hoàn thành — sẵn sàng Export';
  return null;
}

function SectionCard({ sectionRef, title, bg, borderColor, labelColor, open, onToggle, children }) {
  return (
    <div
      ref={sectionRef}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        marginBottom: '12px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'monospace', color: labelColor, fontWeight: '700', fontSize: '13px',
          textAlign: 'left',
        }}
      >
        <span>{title}</span>
        <span style={{
          fontSize: '16px', lineHeight: 1, display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 18px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function MobileDashboard({ activeProject, showToast }) {
  const { mode, theme, toggleTheme } = useTheme();

  const [allPrompts, setAllPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState([]);
  const [responseIds, setResponseIds] = useState([]);
  const [refreshResponses, setRefreshResponses] = useState(0);
  const [progressData, setProgressData] = useState({
    loaded: false, responseCount: 0, hasSummary: false, hasDecision: false, decisionComplete: false,
  });
  const [dataVersion, setDataVersion] = useState(0);
  const bumpData = useCallback(() => setDataVersion((n) => n + 1), []);

  const [open, setOpen] = useState({
    project: false, prompt: false, response: false, summary: false, decision: false, export: false,
  });
  const openedForProjectRef = useRef(null);
  const scrollContainerRef  = useRef(null);

  const projectRef  = useRef(null);
  const promptRef   = useRef(null);
  const responseRef = useRef(null);
  const summaryRef  = useRef(null);
  const decisionRef = useRef(null);
  const exportRef   = useRef(null);

  const openAndScroll = (key, ref) => {
    setOpen((prev) => ({ ...prev, [key]: true }));
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    );
  };

  useEffect(() => {
    let mounted = true;
    setLoadingPrompts(true);
    supabase.from('rl_prompts').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.error('Error loading prompts:', error);
        else setAllPrompts(data || []);
        setLoadingPrompts(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setRefreshResponses((n) => n + 1);
    setResponseIds([]);
    setProgressData({ loaded: false, responseCount: 0, hasSummary: false, hasDecision: false, decisionComplete: false });
    openedForProjectRef.current = null;
    setOpen({ project: false, prompt: false, response: false, summary: false, decision: false, export: false });
    requestAnimationFrame(() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' }));
    if (!activeProject?.id) { setSelectedPromptIds([]); return; }
    try {
      const saved = localStorage.getItem(`prompt_selection_${activeProject.id}`);
      const parsed = saved ? JSON.parse(saved) : [];
      setSelectedPromptIds(Array.isArray(parsed) ? parsed : []);
    } catch { setSelectedPromptIds([]); }
  }, [activeProject?.id]);

  useEffect(() => {
    if (!activeProject?.id) return;
    localStorage.setItem(`prompt_selection_${activeProject.id}`, JSON.stringify(selectedPromptIds));
  }, [selectedPromptIds, activeProject?.id]);

  useEffect(() => {
    if (!activeProject?.input?.trim()) setSelectedPromptIds([]);
  }, [activeProject?.input]);

  useEffect(() => {
    if (!activeProject?.id) return;
    let mounted = true;
    const fetch = async () => {
      try {
        const [respRes, sumRes, decRes] = await Promise.all([
          supabase.from('rl_responses').select('id').eq('project_id', activeProject.id),
          supabase.from('rl_summaries').select('id').eq('project_id', activeProject.id).limit(1).maybeSingle(),
          supabase.from('rl_decisions').select('verdict,risk,action').eq('project_id', activeProject.id)
            .order('created_at', { ascending: false }).limit(1),
        ]);
        if (!mounted) return;
        if (respRes.error) throw respRes.error;
        if (sumRes.error) throw sumRes.error;
        if (decRes.error) throw decRes.error;
        const ids = respRes.data || [];
        const dec = decRes.data?.[0];
        setResponseIds(ids);
        setProgressData({
          loaded:           true,
          responseCount:    ids.length,
          hasSummary:       !!sumRes.data,
          hasDecision:      !!dec,
          decisionComplete: !!(
            (typeof dec?.verdict === 'string' && dec.verdict.trim()) &&
            (typeof dec?.risk === 'string' && dec.risk.trim()) &&
            (typeof dec?.action === 'string' && dec.action.trim())
          ),
        });
      } catch (err) { console.error('Progress fetch error:', err); }
    };
    fetch();
    return () => { mounted = false; };
  }, [activeProject?.id, dataVersion]);

  useEffect(() => { bumpData(); }, [refreshResponses]);

  // Compute before effects that depend on them
  const wf = getWorkflowState({
    project: activeProject,
    selectedPrompts: selectedPromptIds,
    responses: responseIds,
    summary: progressData.hasSummary ? {} : null,
  });

  const stepIndex = computeStepIndex({ project: activeProject, selectedPromptIds, ...progressData });
  const hint = computeHint(stepIndex, progressData.responseCount);

  // Once per project: open the section matching the current workflow step
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeProject?.id || !progressData.loaded) return;
    if (openedForProjectRef.current === activeProject.id) return;
    openedForProjectRef.current = activeProject.id;
    const stepToKey = ['project', 'prompt', 'response', 'summary', 'decision', 'export'];
    const key = stepToKey[Math.min(stepIndex, 5)];
    setOpen((prev) => ({ ...prev, [key]: true }));
  }, [progressData.loaded, activeProject?.id, stepIndex]);

  if (!activeProject) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', color: theme.subtext, fontFamily: 'monospace',
        background: theme.bg, textAlign: 'center', transition: 'background 0.25s',
      }}>
        <div>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
          <div>Chọn dự án từ menu để bắt đầu</div>
        </div>
      </div>
    );
  }

  const s = theme.sections;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: theme.bg, color: theme.text, fontFamily: 'monospace',
      transition: 'background 0.25s, color 0.25s',
    }}>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${theme.border}`,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: theme.card, flexShrink: 0,
        transition: 'background 0.25s',
      }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
          <strong style={{
            fontSize: '14px', color: theme.text, display: 'block',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeProject.name}
          </strong>
          <span style={{ fontSize: '10px', color: theme.subtext }}>Mobile Flow</span>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            padding: '7px 12px', borderRadius: '6px', border: `1px solid ${theme.border}`,
            background: theme.bg, color: theme.text, cursor: 'pointer',
            fontFamily: 'monospace', fontSize: '14px', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          {mode === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar stepIndex={stepIndex} hint={hint} />

      {/* Scrollable cards */}
      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', WebkitOverflowScrolling: 'touch' }}>

        {/* 1 · Dự án */}
        <SectionCard
          sectionRef={projectRef}
          title="1 · Dự án"
          bg={s.project.bg} borderColor={s.project.border} labelColor={s.project.label}
          open={open.project} onToggle={() => setOpen((p) => ({ ...p, project: !p.project }))}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '15px', color: theme.text }}>
            {activeProject.name}
          </p>
          <p style={{ margin: 0, color: theme.subtext, whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.6' }}>
            {activeProject.input}
          </p>
        </SectionCard>

        {/* 2 · Prompt Pack */}
        <SectionCard
          sectionRef={promptRef}
          title="2 · Prompt Pack"
          bg={s.prompt.bg} borderColor={s.prompt.border} labelColor={s.prompt.label}
          open={open.prompt} onToggle={() => setOpen((p) => ({ ...p, prompt: !p.prompt }))}
        >
          {loadingPrompts ? (
            <p style={{ color: theme.subtext, fontSize: '13px', textAlign: 'center', padding: '16px 0', margin: 0 }}>
              Đang tải prompt...
            </p>
          ) : (
            <>
              <PromptSelector
                prompts={allPrompts}
                selectedIds={selectedPromptIds}
                onSelectionChange={setSelectedPromptIds}
                disabled={!wf.canSelectPrompt}
                disabledReason="👉 Nhập ý tưởng trước"
              />
              <PromptPackPanel
                prompts={allPrompts}
                selectedIds={selectedPromptIds}
                projectInput={activeProject.input}
                showToast={showToast}
                projectId={activeProject.id}
              />
            </>
          )}
        </SectionCard>

        {/* 3 · Phản hồi AI */}
        <SectionCard
          sectionRef={responseRef}
          title="3 · Phản hồi AI"
          bg={s.response.bg} borderColor={s.response.border} labelColor={s.response.label}
          open={open.response} onToggle={() => setOpen((p) => ({ ...p, response: !p.response }))}
        >
          <ResponseInput
            projectId={activeProject.id}
            onCreated={() => {
              setRefreshResponses((n) => n + 1);
              bumpData();
              openAndScroll('summary', summaryRef);
            }}
            disabled={!wf.canGenerateResponse}
            disabledReason="👉 Chọn prompt trước"
          />
          <ResponseList projectId={activeProject.id} refresh={refreshResponses} />
        </SectionCard>

        {/* 4 · Tổng hợp */}
        <SectionCard
          sectionRef={summaryRef}
          title="4 · Tổng hợp"
          bg={s.summary.bg} borderColor={s.summary.border} labelColor={s.summary.label}
          open={open.summary} onToggle={() => setOpen((p) => ({ ...p, summary: !p.summary }))}
        >
          <SummaryPanel
            projectId={activeProject.id}
            onCreated={() => {
              bumpData();
              openAndScroll('decision', decisionRef);
            }}
            canSummarize={wf.canSummarize}
            showToast={showToast}
          />
        </SectionCard>

        {/* 5 · Quyết định */}
        <SectionCard
          sectionRef={decisionRef}
          title="5 · Quyết định"
          bg={s.decision.bg} borderColor={s.decision.border} labelColor={s.decision.label}
          open={open.decision} onToggle={() => setOpen((p) => ({ ...p, decision: !p.decision }))}
        >
          <DecisionPanel
            projectId={activeProject.id}
            onCreated={() => {
              bumpData();
              openAndScroll('export', exportRef);
            }}
            canDecide={wf.canDecide}
            showToast={showToast}
          />
        </SectionCard>

        {/* Export */}
        <SectionCard
          sectionRef={exportRef}
          title="Export"
          bg={s.export.bg} borderColor={s.export.border} labelColor={s.export.label}
          open={open.export} onToggle={() => setOpen((p) => ({ ...p, export: !p.export }))}
        >
          <ExportPanel projectId={activeProject.id} />
        </SectionCard>

      </div>
    </div>
  );
}

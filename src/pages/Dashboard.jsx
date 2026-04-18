import { useState, useEffect, useCallback } from 'react';
import { ResponseInput } from '../components/response/ResponseInput';
import { ResponseList } from '../components/response/ResponseList';
import { SummaryPanel } from '../components/summary/SummaryPanel';
import { DecisionPanel } from '../components/decision/DecisionPanel';
import { ExportPanel } from '../components/export/ExportPanel';
import { PromptSelector } from '../components/prompt/PromptSelector';
import { PromptPackPanel } from '../components/prompt/PromptPackPanel';
import { CanvasViewConnected } from '../components/canvas/CanvasView';
import { ProgressBar } from '../components/project/ProgressBar';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeProvider';
import { getWorkflowState } from '../lib/workflow';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileDashboard } from './MobileDashboard';
import { ProjectForm } from '../components/project/ProjectForm';

const cardBase = {
  borderRadius: '12px', padding: '16px', marginBottom: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

function HoverCard({ style, children, id }) {
  const { mode } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      id={id}
      style={{
        ...style,
        transition: 'box-shadow 0.15s, transform 0.15s, background 0.25s, border-color 0.25s',
        willChange: 'transform',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered
          ? `0 4px 14px rgba(0,0,0,${mode === 'dark' ? '0.5' : '0.1'})`
          : (style.boxShadow || 'none'),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}

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

const STEP_SECTION_ID = {
  idea: 'section-project', prompt: 'section-prompt',
  response: 'section-response', summary: 'section-summary', decision: 'section-decision',
};

function getNextAction(wf, responseCount) {
  if (!wf.canSelectPrompt)     return { text: '👉 Nhập ý tưởng cho dự án', step: 'idea' };
  if (!wf.canGenerateResponse) return { text: '👉 Chọn ít nhất 1 prompt', step: 'prompt' };
  if (!wf.canSummarize)        return { text: `👉 Thêm phản hồi AI (${responseCount}/2 cần thiết)`, step: 'response' };
  if (!wf.canDecide)           return { text: '👉 Tạo tổng hợp từ các phản hồi', step: 'summary' };
  return { text: '✅ Sẵn sàng ra quyết định', step: 'decision' };
}

export function Dashboard({ activeProject, showToast, onProjectCreated }) {
  const isMobile = useIsMobile();
  const { mode, theme, toggleTheme } = useTheme();
  const [showNewForm, setShowNewForm] = useState(false);

  // Theme-derived styles (inside component because they depend on theme)
  const cards = {
    project:  { ...cardBase, background: theme.sections.project.bg,  border: `1px solid ${theme.sections.project.border}` },
    prompt:   { ...cardBase, background: theme.sections.prompt.bg,   border: `1px solid ${theme.sections.prompt.border}` },
    response: { ...cardBase, background: theme.sections.response.bg, border: `1px solid ${theme.sections.response.border}` },
    summary:  { ...cardBase, background: theme.sections.summary.bg,  border: `1px solid ${theme.sections.summary.border}` },
    decision: { ...cardBase, background: theme.sections.decision.bg, border: `1px solid ${theme.sections.decision.border}` },
    export:   { ...cardBase, background: theme.sections.export.bg,   border: `1px solid ${theme.sections.export.border}` },
  };

  const sectionTitle = (key) => ({
    fontWeight: '700', fontSize: '10px', color: theme.sections[key].label,
    textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
  });

  const tabStyle = (active) => ({
    padding: '6px 16px', cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: active ? `2px solid ${theme.text}` : '2px solid transparent',
    fontWeight: active ? 'bold' : 'normal', fontFamily: 'monospace', fontSize: '13px',
    color: theme.text,
  });

  const [refreshResponses, setRefreshResponses] = useState(0);
  const [allPrompts, setAllPrompts] = useState([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState([]);
  const [activeTab, setActiveTab] = useState('flow');

  const [progressData, setProgressData] = useState({ responseCount: 0, hasSummary: false, hasDecision: false, decisionComplete: false });
  const [dataVersion, setDataVersion] = useState(0);
  const bumpData = useCallback(() => setDataVersion((n) => n + 1), []);

  useEffect(() => {
    let mounted = true;
    supabase.from('rl_prompts').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Error loading prompts:', error); return; }
        if (mounted) setAllPrompts(data || []);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
  if (!activeProject?.id) {
    setSelectedPromptIds([]);
    return;
  }

  setActiveTab('flow');
  setRefreshResponses(n => n + 1);

  try {
    const saved = localStorage.getItem(`prompt_selection_${activeProject.id}`);
    setSelectedPromptIds(saved ? JSON.parse(saved) : []);
  } catch {
    setSelectedPromptIds([]);
  }
}, [activeProject?.id]);

  useEffect(() => {
    if (!activeProject?.id) return;
    localStorage.setItem(`prompt_selection_${activeProject.id}`, JSON.stringify(selectedPromptIds));
  }, [selectedPromptIds, activeProject?.id]);

  // Clear prompt selection when project has no input (can't use prompts yet)
  useEffect(() => {
    if (!activeProject?.id) return;
    if (activeProject.input == null) return; // chưa load xong

    if (activeProject.input.trim() === '') {
      setSelectedPromptIds([]);
    }
  }, [activeProject?.input]);

  useEffect(() => {
    if (!activeProject?.id) return;
    let mounted = true;
    const fetch = async () => {
      try {
        const [respRes, sumRes, decRes] = await Promise.all([
          supabase.from('rl_responses').select('id').eq('project_id', activeProject.id),
          supabase.from('rl_summaries').select('id').eq('project_id', activeProject.id).limit(1).maybeSingle(),
          supabase.from('rl_decisions').select('verdict,risk,action').eq('project_id', activeProject.id).order('created_at', { ascending: false }).limit(1),
        ]);
        if (!mounted) return;
        const dec = decRes.data?.[0];
        setProgressData({
          responseCount:    respRes.data?.length || 0,
          hasSummary:       !!sumRes.data,
          hasDecision:      !!dec,
          decisionComplete: !!(dec?.verdict?.trim() && dec?.risk?.trim() && dec?.action?.trim()),
        });
      } catch (err) { console.error('Progress fetch error:', err); }
    };
    fetch();
    return () => { mounted = false; };
  }, [activeProject?.id, dataVersion]);

  useEffect(() => {
  if (refreshResponses > 0) {
    bumpData();
  }
}, [refreshResponses]);

  const stepIndex = computeStepIndex({ project: activeProject, selectedPromptIds, ...progressData });
  const hint = computeHint(stepIndex, progressData.responseCount);

  const wf = getWorkflowState({
    project: activeProject,
    selectedPrompts: selectedPromptIds,
    responses: { length: progressData.responseCount },
    summary: progressData.hasSummary ? {} : null,
  });

  const nextAction = getNextAction(wf, progressData.responseCount);

  const handleStepClick = (stepKey) => {
    if (activeTab !== 'flow') setActiveTab('flow');
    setTimeout(() => {
      const id = STEP_SECTION_ID[stepKey];
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  if (isMobile) {
    return <MobileDashboard activeProject={activeProject} showToast={showToast} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'monospace', background: theme.bg, color: theme.text, transition: 'background 0.25s, color 0.25s' }}>

      {/* Create Project — always visible */}
      <div style={{ borderBottom: `1px solid ${theme.border}`, background: theme.card, flexShrink: 0, transition: 'background 0.25s, border-color 0.25s' }}>
        {showNewForm || !activeProject ? (
          <div style={{ padding: '16px', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: '700', fontSize: '11px', color: theme.sections.project.label, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {activeProject ? '✨ Tạo dự án mới' : '✨ Tạo dự án để bắt đầu'}
              </span>
              {activeProject && (
                <button onClick={() => setShowNewForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.subtext, fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
              )}
            </div>
            <ProjectForm onCreated={(created) => { setShowNewForm(false); onProjectCreated && onProjectCreated(created); }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: theme.text }}>{activeProject.name}</strong>
              <span style={{ color: theme.subtext, fontSize: '10px', marginLeft: '10px' }}>{activeProject.id}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button style={tabStyle(activeTab === 'flow')}   onClick={() => setActiveTab('flow')}>Flow</button>
              <button style={tabStyle(activeTab === 'canvas')} onClick={() => setActiveTab('canvas')}>Canvas</button>
              <button onClick={() => setShowNewForm(true)} style={{ ...tabStyle(false), fontSize: '12px' }}>+ New</button>
              <button
                onClick={toggleTheme}
                title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                style={{ marginLeft: '8px', padding: '5px 10px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', transition: 'background 0.2s, border-color 0.2s' }}
              >
                {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!activeProject ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.subtext, fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center' }}>
            <div>☝️ Nhập thông tin dự án bên trên để bắt đầu</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Hoặc chọn dự án có sẵn từ sidebar</div>
          </div>
        </div>
      ) : (<>

      {/* Progress bar */}
      {activeTab === 'flow' && (
        <ProgressBar stepIndex={stepIndex} hint={hint} onStepClick={handleStepClick} />
      )}

      {/* Canvas tab */}
      {activeTab === 'canvas' && activeProject && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CanvasViewConnected
            project={activeProject}
            promptCount={selectedPromptIds.length}
            prompts={allPrompts}
            showToast={showToast}
          />
        </div>
      )}

      {/* Flow tab */}
      {activeTab === 'flow' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', alignContent: 'start', background: theme.bg }}>

          {/* Next action banner */}
          <div
            style={{ gridColumn: '1 / -1', cursor: nextAction.step ? 'pointer' : 'default' }}
            onClick={() => nextAction.step && handleStepClick(nextAction.step)}
          >
            <div style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
              background: nextAction.text.startsWith('✅') ? theme.sections.response.bg : theme.sections.prompt.bg,
              border: `1px solid ${nextAction.text.startsWith('✅') ? theme.sections.response.border : theme.sections.prompt.border}`,
              color: nextAction.text.startsWith('✅') ? theme.sections.response.label : theme.sections.prompt.label,
              transition: 'background 0.2s',
            }}>
              {nextAction.text}
            </div>
          </div>

          <div>
            <HoverCard id="section-project" style={cards.project}>
              <div style={sectionTitle('project')}>1 · Dự án</div>
              <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '13px', color: theme.text }}>{activeProject.name}</p>
              <p style={{ margin: 0, color: theme.subtext, whiteSpace: 'pre-wrap', fontSize: '12px' }}>{activeProject.input}</p>
            </HoverCard>

            <HoverCard id="section-prompt" style={cards.prompt}>
              <div style={sectionTitle('prompt')}>2 · Prompt Pack</div>
              <PromptSelector
                prompts={allPrompts}
                selectedIds={selectedPromptIds}
                onSelectionChange={setSelectedPromptIds}
                disabled={!wf.canSelectPrompt}
                disabledReason="👉 Nhập ý tưởng trước"
              />
              <PromptPackPanel prompts={allPrompts} selectedIds={selectedPromptIds} projectInput={activeProject.input} showToast={showToast} projectId={activeProject.id} />
            </HoverCard>

            <HoverCard id="section-response" style={cards.response}>
              <div style={sectionTitle('response')}>3 · Phản hồi AI</div>
              <ResponseInput
                projectId={activeProject.id}
                onCreated={() => { setRefreshResponses((n) => n + 1); bumpData(); }}
                disabled={!wf.canGenerateResponse}
                disabledReason="👉 Chọn prompt trước"
              />
              <ResponseList projectId={activeProject.id} refresh={refreshResponses} />
            </HoverCard>
          </div>

          <div>
            <HoverCard id="section-summary" style={cards.summary}>
              <div style={sectionTitle('summary')}>4 · Tổng hợp</div>
              <SummaryPanel projectId={activeProject.id} onCreated={bumpData} canSummarize={wf.canSummarize} showToast={showToast} />
            </HoverCard>

            <HoverCard id="section-decision" style={cards.decision}>
              <div style={sectionTitle('decision')}>5 · Quyết định</div>
              <DecisionPanel projectId={activeProject.id} onCreated={bumpData} canDecide={wf.canDecide} showToast={showToast} />
            </HoverCard>

            <HoverCard style={cards.export}>
              <div style={sectionTitle('export')}>Export</div>
              <ExportPanel projectId={activeProject.id} />
            </HoverCard>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}

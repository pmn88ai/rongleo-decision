export function getWorkflowState({ project, selectedPrompts, responses, summary }) {
  const prompts  = selectedPrompts ?? [];
  const resCount = responses?.length ?? 0;
  return {
    canSelectPrompt:     !!project?.input?.trim(),
    canGenerateResponse: prompts.length > 0,
    canSummarize:        resCount >= 2,
    canDecide:           !!(summary?.content || summary),
  };
}

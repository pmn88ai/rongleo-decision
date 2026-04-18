import { supabase } from './supabase';

export async function exportProjectData(projectId) {
  if (!projectId) {
    throw new Error('Missing projectId');
  }
  const [projectRes, responsesRes, summariesRes, decisionsRes] = await Promise.all([
    supabase.from('rl_projects').select('*').eq('id', projectId).single(),
    supabase.from('rl_responses').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('rl_summaries').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
    supabase.from('rl_decisions').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
  ]);

  if (projectRes.error) throw projectRes.error;
  if (responsesRes.error) throw responsesRes.error;
  if (summariesRes.error) throw summariesRes.error;
  if (decisionsRes.error) throw decisionsRes.error;

  return {
    meta: {
      exported_at: new Date().toISOString(),
      version: '1.0',
    },
    project: projectRes.data || null,
    responses: responsesRes.data || [],
    summary: summariesRes.data?.[0] || null,
    decision: decisionsRes.data?.[0] || null,
  };
}

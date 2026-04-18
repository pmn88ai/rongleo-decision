const inject = (tpl, input) =>
  tpl
    .replaceAll('[chủ đề]', input)
    .replaceAll('[CHỦ ĐỀ]', input)
    .replaceAll('{{input}}', input);

export function generatePromptPack(prompts, projectInput) {
  const input = projectInput || '';
  return prompts
    .map((p) => {
      if (!p.template) return null;
      return { name: p.name, content: inject(p.template, input) };
    })
    .filter(Boolean);
}

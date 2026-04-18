const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

function ensureApiKey() {
  if (!GROQ_API_KEY) {
    throw new Error('Missing VITE_GROQ_API_KEY');
  }
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateDecision(summary) {
  ensureApiKey();
  const prompt = `Bạn là chuyên gia ra quyết định.

Dựa trên summary sau:
${summary}

Hãy trả về JSON với format:

{
  "verdict": "NÊN LÀM hoặc KHÔNG NÊN LÀM + lý do ngắn gọn",
  "risk": "3 rủi ro lớn nhất, rõ ràng",
  "action": "3 bước hành động đầu tiên"
}

KHÔNG thêm text ngoài JSON.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await res.json();

  if (!data?.choices?.[0]?.message?.content) {
    throw new Error('Invalid Groq response format');
  }

  const raw = data.choices[0].message.content.trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // try extracting JSON block if model added surrounding text
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Cannot parse decision JSON from Groq response');
    parsed = JSON.parse(match[0]);
  }

  if (!parsed.verdict || !parsed.risk || !parsed.action) {
    throw new Error('Decision JSON missing required fields');
  }

  const safe = (v) => {
  if (Array.isArray(v)) return v.join('\n');
  if (typeof v === 'string') return v.trim();
  return '';
};

return {
  verdict: safe(parsed.verdict),
  risk: safe(parsed.risk),
  action: safe(parsed.action),
};
}

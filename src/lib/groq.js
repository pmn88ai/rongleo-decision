const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error('Missing VITE_GROQ_API_KEY');
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function summarizeResponses(responses) {
  const responsesText = responses
    .map((r, i) => `[${i + 1}] Nguồn: ${r.source}\n${r.content}`)
    .join('\n\n---\n\n');

  const prompt = `Bạn là chuyên gia chiến lược.

Dựa trên các phân tích sau:
${responsesText}

Hãy:

1. Tóm tắt insight quan trọng (ngắn gọn)
2. Chỉ ra điểm giống và khác giữa các AI
3. Đánh giá tính khả thi (1-10)
4. Liệt kê 3 rủi ro lớn nhất
5. Đưa ra kết luận rõ ràng: nên làm hay không
6. Đề xuất 3 bước hành động đầu tiên`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
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
  return data.choices[0].message.content.trim();
}

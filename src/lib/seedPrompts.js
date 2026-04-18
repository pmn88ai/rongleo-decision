import { supabase } from './supabase';

const SEED_DATA = [
  { name: 'Brainwriting', template: 'Hãy cùng động não về các ý tưởng cho {{input}} bằng cách viết ra càng nhiều ý tưởng càng tốt, sau đó tôi có thể xây dựng dựa trên chúng bằng các ý tưởng liên quan. Cấu trúc câu trả lời bằng markdown.' },
  { name: 'Reverse Brainstorming', template: 'Chúng ta sẽ sử dụng động não ngược cho {{input}} - đưa ra những ý tưởng cố tình xấu để khơi dậy sự sáng tạo.' },
  { name: 'Mind Mapping', template: 'Hãy tạo một bản đồ tư duy hoàn chỉnh cho {{input}} bắt đầu từ khái niệm trung tâm và mở rộng ra các nhánh.' },
  { name: 'Assumptions', template: 'Liệt kê các giả định về {{input}}. Sau đó thách thức chúng để tạo ra ý tưởng mới.' },
  { name: 'SWOT Analysis', template: 'Thực hiện phân tích SWOT cho {{input}}: điểm mạnh, điểm yếu, cơ hội, rủi ro. Kết luận rõ ràng.' },
  { name: 'SCAMPER', template: 'Sử dụng SCAMPER để phân tích {{input}}: thay thế, kết hợp, điều chỉnh, sửa đổi, mục đích khác, loại bỏ, đảo ngược.' },
  { name: 'Six Thinking Hats', template: 'Phân tích {{input}} theo 6 góc nhìn: tích cực, tiêu cực, cảm xúc, logic, sáng tạo, kiểm soát.' },
  { name: 'Worst Idea', template: 'Đưa ra các ý tưởng tệ nhất cho {{input}} và giải thích vì sao chúng tệ.' },
  { name: 'Trigger Words', template: 'Dùng các từ ngẫu nhiên để tạo ý tưởng cho {{input}}.' },
  { name: 'Questioning', template: 'Đặt các câu hỏi 5W1H cho {{input}} và chuyển thành ý tưởng.' },
  { name: 'Rolestorming', template: 'Đóng vai người dùng để phân tích {{input}} và đề xuất ý tưởng cải thiện.' },
  { name: 'Scenarios', template: 'Tạo kịch bản tốt nhất và tệ nhất cho {{input}}, sau đó đề xuất hướng đi.' },
  { name: 'Analogy Thinking', template: '{{input}} giống với cái gì? Dựa vào đó để phát triển ý tưởng.' },
  { name: 'Idea Spurring', template: 'Phát triển ý tưởng từ điểm bắt đầu liên quan đến {{input}}.' },
];

export async function seedPrompts() {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('rl_prompts')
      .select('name');
    if (fetchError) throw fetchError;

    const existingNames = new Set((existing || []).map((p) => p.name));

    const toInsert = SEED_DATA.filter((p) => !existingNames.has(p.name));

    if (toInsert.length === 0) {
      console.log('[seedPrompts] Tất cả prompt đã tồn tại, bỏ qua.');
      return;
    }

    const { error: insertError } = await supabase.from('rl_prompts').insert(toInsert);
    if (insertError) throw insertError;

    console.log(`[seedPrompts] Đã insert ${toInsert.length} prompt:`, toInsert.map((p) => p.name));
  } catch (err) {
    console.error('[seedPrompts] Lỗi:', err);
  }
}

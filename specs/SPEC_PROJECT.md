# 🎯 PROJECT

Tên: RongLeo Mind OS (tạm)
Mục tiêu chính:
Xây dựng web app giúp tổ chức tư duy, phân tích đa góc nhìn và ra quyết định cho dự án/ý tưởng, sử dụng nhiều AI (ChatGPT, Grok, Claude...) theo workflow thủ công (copy/paste) + tổng hợp bằng Groq.

---

# 🧠 PROBLEM

- Dùng AI rời rạc → mất context
- Ý tưởng nhiều nhưng không hệ thống hóa
- Không có nơi lưu + so sánh + tổng hợp
- Khó đánh giá rủi ro / hiệu quả / quyết định cuối
- Copy/paste nhiều nhưng không có workflow chuẩn

---

# ✅ GOAL

- Biến prompt thành hệ thống tư duy có cấu trúc
- Lưu toàn bộ quá trình suy nghĩ thành graph
- Cho phép dùng nhiều AI + tổng hợp + ra quyết định
- Export JSON để reuse
- Sync đa thiết bị

---

## REQUIRE

- CRUD Project
- CRUD Prompt
- Tạo Prompt Pack (nhiều prompt cùng lúc)
- Copy prompt nhanh
- Dán kết quả từ nhiều AI
- Tổng hợp bằng Groq (manual)
- Decision Node (kết luận cuối)
- Canvas desktop + card mobile
- Dark/Light mode
- Sync Supabase

## INPUT

- Nội dung dự án / ý tưởng
- Prompt templates
- Kết quả từ AI (paste vào)

## OUTPUT

- Prompt pack
- Responses từ nhiều AI
- Groq summary
- Decision (verdict, risk, action)
- JSON export

## EDGE CASE

- Không có response → không cho tổng hợp
- Prompt rỗng
- Output quá dài
- AI trả mâu thuẫn

## OUT OF SCOPE

- Không auto call API AI (giai đoạn đầu)
- Không multi-user
- Không realtime

## CURRENT FEATURE

- Prompt Library (CRUD)
- Project flow:
  - Generate prompt pack
  - Collect responses
  - Groq summary
  - Decision node
- Lưu project
- Export JSON
- Config Groq

## DEFINITION OF DONE

Một project được coi là hoàn thành khi:

- Tạo project thành công
- Thêm prompt và generate prompt pack OK
- Dán ít nhất 2 responses từ AI khác nhau
- Groq tổng hợp không lỗi
- Có decision (verdict + risk + action)
- Export JSON đúng format
- Reload lại vẫn giữ dữ liệu (Supabase OK)

# AI CONTROL SYSTEM

---

🔥 FLOW CHUẨN (LEVEL PRO)
🧩 BƯỚC 1 – Mày → tao
Dùng chế độ: MASTER PROMPT + ANTI-BUG + CHỈ RÕ FILE/DÒNG

Feature: Project

👉 Tao sẽ:

viết prompt master
kèm anti-bug rule
🧠 BƯỚC 2 – Mày → DeepSeek

👉 Dán prompt tao đưa

🤖 BƯỚC 3 – DeepSeek trả code

👉 Mày KHÔNG dùng luôn

🔁 BƯỚC 4 – Bắt nó tự review
Review lại code vừa viết:
...
🧪 BƯỚC 5 – Mày test
chạy web
click thử
🧠 BƯỚC 6 – Mày → tao (nếu có lỗi)
Code bị lỗi:

- mô tả lỗi
- gửi file

Yêu cầu:

- fix cụ thể từng file/dòng
  🔧 BƯỚC 7 – tao fix

👉 tao trả:

BEFORE / AFTER
file rõ ràng
🚀 BƯỚC 8 – DONE feature

---

# XEM DEV_GUIDE.md để hiểu hướng dẫn từng bước thực hiện code Project

---

# XEM PROJECT_STRUCTURE.md để hiểu cấu trúc toàn bộ Project

---

# ĐỐI VỚI PROJECT

## 🎯 Mỗi lần làm PROJECT MỚI:

1. IDEA
   → nói với ChatGPT

2. SPEC (1 lần) => SPEC_PROJECT.md
   → fill template

3. (OPTIONAL) phản biện
   → chỉ khi task lớn

4. CHIA TASK => TASK_PROJECT.md

5. LÀM 1 TASK

6. UPDATE LOG + TASK + TASK_PROJECT

7. LẶP

---

# ĐỐI VỚI FEATURE (CHỨC NĂNG TRONG PROJECT)

## FLOW

1. Viết SPEC
2. Update TASK.md
3. Code (DeepSeek)
4. Review (ChatGPT)
5. Fix
6. Test

## 🎯 Mỗi lần làm việc:

B1: 👉 Mở: SPEC.md + TASK.md

B2: 👉 Chạy: node ai-control/ai-flow.js

B3: 👉 Làm đúng 1 việc duy nhất

B4: 👉 Update:
TASK.md
LOG.md

👉 XONG.

---

## RULE

- không có SPEC → không code
- không skip step
- luôn update TASK.md

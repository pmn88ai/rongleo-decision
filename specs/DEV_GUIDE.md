# 🚀 DEV GUIDE – RongLeo Mind OS

## 🧭 Nguyên tắc

- Làm theo thứ tự, không nhảy bước
- Mỗi bước xong phải chạy được
- Không viết lại logic nhiều lần

---

PHASE 1 – Project
PHASE 2 – Response
PHASE 3 – Groq
PHASE 4 – Decision
PHASE 5 – Prompt
PHASE 6 – Prompt Pack

---

## ⚙️ Tech stack

- React + Vite
- TailwindCSS
- React Flow
- Supabase
- Zustand (state nhẹ)
- uuid

---

## 🔁 DATA FLOW

project
→ responses
→ summary (Groq)
→ decision

## prompt = hỗ trợ generate, không phải core

## 🧱 PHASE 0 – Cấu trúc project

### Tạo project

cd D:\WORK\projects
npm create vite@latest rongleo-decision -- --template react
cd D:\WORK\projects\rongleo-decision
npm install

### Cài lib

npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

npm install @supabase/supabase-js
npm install reactflow
npm install zustand
npm install uuid

---

## 🎨 Setup Tailwind

### tailwind.config.js

content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]

### src/index.css

@tailwind base;
@tailwind components;
@tailwind utilities;

---

## 🔌 Supabase

### src/lib/supabase.js

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
import.meta.env.VITE_SUPABASE_URL,
import.meta.env.VITE_SUPABASE_KEY
)

---

## 🧠 ENV

### .env

VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...
VITE_GROQ_API_KEY=...

---

## 🗄️ Database (chạy SQL 1 lần)

-- PROMPTS
create table if not exists rl_prompts (
id uuid primary key default gen_random_uuid(),
name text,
template text,
created_at timestamp default now()
);

-- PROJECTS
create table if not exists rl_projects (
id uuid primary key default gen_random_uuid(),
name text,
input text,
user_id text,
created_at timestamp default now()
);

-- RESPONSES
create table if not exists rl_responses (
id uuid primary key default gen_random_uuid(),
project_id uuid references rl_projects(id) on delete cascade,
source text,
content text,
created_at timestamp default now()
);

-- SUMMARIES
create table if not exists rl_summaries (
id uuid primary key default gen_random_uuid(),
project_id uuid references rl_projects(id) on delete cascade,
content text
);

-- DECISIONS
create table if not exists rl_decisions (
id uuid primary key default gen_random_uuid(),
project_id uuid references rl_projects(id) on delete cascade,
verdict text,
risk text,
action text
);

create index if not exists idx_rl_responses_project
on rl_responses(project_id);

create index if not exists idx_rl_summaries_project
on rl_summaries(project_id);

create index if not exists idx_rl_decisions_project
on rl_decisions(project_id);

---

## 🧠 PHASE 1 – Prompt system

### Mục tiêu

CRUD prompt

### Làm

- tạo UI list
- form thêm/sửa
- gọi supabase

---

## 📦 PHASE 2 – Project

### Mục tiêu

Tạo project + input

---

## ⚙️ PHASE 3 – Prompt Pack

### Logic

template.replace("{{input}}", project.input)

---

## 📥 PHASE 4 – Response

- textarea
- source
- save

---

## 🧠 PHASE 5 – Groq

### Prompt Groq chuẩn

Bạn là chuyên gia chiến lược.

Dựa trên các phân tích sau:
{{responses}}

Hãy:

1. Tóm tắt insight quan trọng (ngắn gọn)
2. Chỉ ra điểm giống và khác giữa các AI
3. Đánh giá tính khả thi (1-10)
4. Liệt kê 3 rủi ro lớn nhất
5. Đưa ra kết luận rõ ràng: nên làm hay không
6. Đề xuất 3 bước hành động đầu tiên

### Logic

- gom tất cả responses
- gọi API
- lưu summary

---

## 🎯 PHASE 6 – Decision

- verdict
- risk
- action

---

## 📤 PHASE 7 – Export

const data = {
project,
prompts,
responses,
summary,
decision
}

---

## 🎨 PHASE 8 – UI

Desktop:

- ReactFlow

Mobile:

- card

---

## ✅ Done khi

- Tạo project OK
- Prompt pack OK
- Paste response OK
- Summary OK
- Decision OK

---

## 🧪 INTEGRATION FLOW

1. Tạo project
2. Dán ít nhất 2 responses
3. Bấm "Tổng hợp"
4. Kiểm tra summary
5. Tạo decision
6. Reload → vẫn còn data

Fail ở đâu fix ở đó trước khi build tiếp

# RongLeo Decision 🧠

Một web app hỗ trợ tư duy & ra quyết định dựa trên AI + workflow + graph.

---

## 🚀 CORE IDEA

Không chỉ chat với AI.

App này giúp:

- Biến ý tưởng → prompt → phản hồi → tổng hợp → quyết định
- Lưu toàn bộ quá trình dưới dạng **graph (node + edge)**
- Theo dõi tiến trình như một pipeline rõ ràng

---

## 🧩 FLOW

1. Idea → nhập ý tưởng
2. Prompt → chọn prompt template
3. Response → nhập phản hồi từ AI (ChatGPT, Groq, Gemini…)
4. Summary → tổng hợp insight
5. Decision → ra quyết định + hành động

---

## 🧠 FEATURE GRAPH (CORE)

Mỗi bước = 1 node  
Quan hệ giữa các bước = edge

=> tạo thành knowledge graph cho từng project

### Tables (Supabase)

- `rl_nodes`
- `rl_edges`

---

## ⚙️ TECH STACK

- React (Vite)
- Supabase (DB + API)
- Groq API (LLM)
- LocalStorage (persist UI state)

---

## 📦 SETUP LOCAL

### 1. Clone

```bash
git clone https://github.com/<your-username>/rongleo-decision.git
cd rongleo-decision
2. Install
npm install
3. ENV

Tạo file .env

VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_GROQ_API_KEY=your_key

⚠️ KHÔNG commit file này lên GitHub

4. Run
npm run dev
🗄️ SETUP DATABASE (SUPABASE)

Chạy file:

supabase_graph.sql

Tạo:

rl_nodes
rl_edges
📊 GRAPH SYSTEM
Node
{
  "id": "...",
  "project_id": "...",
  "type": "idea | prompt | response | summary | decision",
  "content": "...",
  "position": { "x": 0, "y": 0 }
}
Edge
{
  "from_node_id": "...",
  "to_node_id": "...",
  "type": "flow"
}
🧠 AI INTEGRATION (GROQ)

File: src/lib/groq.js

Model:

model: "llama-3.3-70b-versatile"
⚠️ SECURITY
Không push .env
Nếu lỡ push → phải:
revoke key
rotate key mới
📤 DEPLOY
Option 1: Vercel
npm run build

Upload lên Vercel + set ENV

Option 2: Netlify
Build command: npm run build
Output: dist
🧪 DEBUG
Lỗi Groq
model deprecated → đổi model
Lỗi trim()
typeof value === "string" && value.trim()
Lỗi state React

Không gọi setState bừa trong useEffect

🎯 ROADMAP
 Drag & drop canvas graph
 Auto generate prompts
 Multi-agent AI
 Export PDF decision report
 Versioning project
🧑‍💻 AUTHOR

RongLeo 🐉

📌 NOTE

Đây không phải tool chat.

Đây là:
👉 hệ thống hóa tư duy + quyết định
```

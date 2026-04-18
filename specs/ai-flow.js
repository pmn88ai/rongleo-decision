const fs = require("fs");

const task = fs.readFileSync("./ai-control/TASK.md", "utf-8");

function getStep() {
  const match = task.match(/CURRENT STEP: (.+)/);
  return match ? match[1].trim() : null;
}

const step = getStep();

const flows = {
  spec: `
👉 BƯỚC: VIẾT SPEC

- dùng SPEC_TEMPLATE.md
- fill đầy đủ GOAL, REQUIRE, EDGE CASE
- chưa rõ thì hỏi ChatGPT
  `,

  code: `
👉 BƯỚC: CODE (DeepSeek)

- mở file đúng
- highlight đúng function
- Ctrl + I

Prompt:

IMPORTANT:
- chỉ sửa đoạn được chọn
- không viết lại toàn bộ file
  `,

  review: `
👉 BƯỚC: REVIEW (ChatGPT)

Prompt:

Review code:
- bug?
- risk?
- fix?
  `,

  fix: `
👉 BƯỚC: FIX (DeepSeek)

- dán list issue
- yêu cầu sửa đúng phần lỗi
  `,

  test: `
👉 BƯỚC: TEST

- test input đúng
- test input sai
- check edge case
  `
};

console.log(flows[step] || "❌ STEP không hợp lệ");
# 📁 PROJECT STRUCTURE – RongLeo Mind OS

src/
app/
App.jsx
routes.jsx

pages/
Dashboard.jsx
ProjectDetail.jsx
PromptLibrary.jsx
Settings.jsx

components/
common/
Button.jsx
Input.jsx
Modal.jsx

    prompt/
      PromptCard.jsx
      PromptEditor.jsx

    project/
      ProjectForm.jsx
      ProjectCard.jsx

    response/
      ResponseInput.jsx
      ResponseList.jsx

    decision/
      DecisionPanel.jsx

    canvas/
      FlowCanvas.jsx

lib/
supabase.js
groq.js

store/
useProjectStore.js
usePromptStore.js

utils/
format.js
export.js

constants/
config.js

styles/
globals.css

.env

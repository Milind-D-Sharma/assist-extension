#AI Assistant (Chrome Extension)

Replayz is a powerful browser-based AI assistant that overlays any webpage and can:
- Read full page content (even off-screen)
- Interact with visible and hidden elements
- Fill forms, click buttons, and simulate typing
- Post YouTube comments, respond to Gmail, Docs, and Canvas LMS
- Switch between OpenAI GPT and Anthropic Claude
- Use natural language and voice commands
- Sync history and preferences with your account (coming in Supabase backend)

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript (modular ES6)
- **Extension Runtime**: Chrome Manifest V3
- **Voice Input**: Web Speech API (coming next)
- **AI Providers**: OpenAI (GPT-4), Anthropic (Claude)
- **Config & Keys**: Local `config/settings.json`
- **Backend (coming)**: Supabase (PostgreSQL, Auth, Realtime)

## Setup
1. Clone the repo or download files into a folder.
2. Fill in `config/settings.json` with your OpenAI and Claude API keys.
3. Open Chrome > `chrome://extensions` > Enable Developer Mode > Load Unpacked > select the folder.
4. Visit any webpage and interact with the floating AI assistant.

## Supported Commands
- Fill: [[FILL:email:user@example.com]]
- Click: [[CLICK:Submit]]
- Scroll: [[SCROLL:bottom]]
- Gmail: [[GMAIL:Hey, thanks!]]
- YouTube Comment: [[YOUTUBE_COMMENT:Great video!]]
- Google Docs: [[GOOGLEDOCS:Meeting notes]]
- Canvas LMS: [[CANVAS_SELECT:Question 2:C]]
- Custom JS: [[JSCODE:document.querySelector('input').value='hi']]

## Coming Soon
- Supabase-authenticated Homebase dashboard
- Voice input toggle in overlay
- Local/Cloud macro library + undo
- Desktop assistant via Electron
- History syncing across Chrome + Desktop

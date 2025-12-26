# Mini Artifact — Project Documentation

Owner: Chris Sotraidis
Created: December 22, 2025
Last Updated: December 25, 2025

---

## What is Mini Artifact?

Mini Artifact is a **web-based proof of concept** demonstrating spec-driven development with AI.

It transforms natural language descriptions into working web applications through a three-layer architecture:

| Layer | Component | What It Does |
|-------|-----------|--------------|
| **Documentation** | Mini-Arnold | Converts descriptions into structured JSON specifications |
| **Orchestration** | Mini-Nedry | Routes intent, validates specs, manages workflow state |
| **Composition** | Mini-Raptor | Assembles patterns into working HTML/CSS/JS |

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/chrissotraidis/mini-artifact.git
cd mini-artifact
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:5173
```

### Configuring Your AI Provider

Mini Artifact supports **two AI providers** for the intelligence layer:

| Provider | Models | API Key Format |
|----------|--------|----------------|
| **OpenAI** | GPT-4o, GPT-4 Turbo | `sk-...` |
| **Anthropic** | Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3 Opus | `sk-ant-...` |

**Option 1: Via the UI (Recommended)**
1. Open the app at http://localhost:5173
2. You'll see an onboarding modal
3. Click "Get Started" → Choose your provider → Enter your API key → "Save & Continue"
4. Or access Settings (⚙️) anytime to switch providers or update keys

**Option 2: Via Environment Variable**
```bash
# Create .env.local with either or both:
echo "VITE_OPENAI_API_KEY=sk-your-key-here" > .env.local
echo "VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env.local
```

Get API keys from:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

> **Note:** API keys are stored in localStorage (browser-only). They're never sent to any server except the respective AI provider.

---

## Using Mini Artifact

### The Workflow: Write → Plan → Build → Review

1. **Write** — Describe what you want to build in the chat panel
2. **Plan** — Mini-Arnold asks clarifying questions and builds a spec
3. **Build** — Click Generate when the spec is complete
4. **Review** — Preview the app and export when satisfied

### Example Session

```
You: "I want a todo list app with tasks that have titles and due dates"

Arnold: "Great! Should tasks have a priority level (high/medium/low)?"

You: "Yes, and a completed status"

Arnold: [Updates spec with entities, views, actions]

[Spec panel shows 85% complete]

You: [Clicks Generate]

[Preview shows working todo app with all features]

You: [Clicks Export to download HTML file]
```

---

## Documentation Structure

All documentation lives in `docs/` with no subfolders.

| Document | Purpose |
|----------|---------|
| `readme.md` | This file — entry point and quick start |
| `spec.md` | Master specification — requirements and success criteria |
| `architecture.md` | System architecture — three-layer separation |
| `components.md` | Component details — Arnold, Nedry, Raptor interfaces |
| `workflow.md` | User workflow — the Write → Plan → Build → Review loop |
| `implementation.md` | Technical guide — code structure, patterns, build |
| `decisions.md` | Decision log — choices made and rationale |

---

## Project Structure

```
mini-artifact/
├── docs/                    # Documentation
├── src/
│   ├── components/          # React UI
│   │   ├── App.tsx          # Main layout
│   │   ├── ChatPanel.tsx    # Conversation UI
│   │   ├── SpecPanel.tsx    # JSON spec display
│   │   ├── PreviewPanel.tsx # Generated app preview
│   │   ├── Controls.tsx     # Input + action buttons
│   │   ├── OnboardingModal.tsx
│   │   ├── SettingsButton.tsx
│   │   └── WorkflowIndicator.tsx
│   │
│   ├── engine/              # Core architecture
│   │   ├── arnold/          # Documentation layer (LLM)
│   │   ├── nedry/           # Orchestration layer
│   │   └── raptor/          # Composition layer (patterns)
│   │
│   ├── store/               # Zustand state management
│   ├── api/                 # API clients
│   │   └── providers/       # Multi-provider abstraction
│   │       ├── index.ts     # Router + key management
│   │       ├── openai.ts    # OpenAI adapter
│   │       └── anthropic.ts # Anthropic adapter
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Template helpers, logging
│
├── api/                     # Vercel Edge Functions
│   └── chat.ts              # Multi-provider LLM proxy
└── public/                  # Static assets
```

---

## Status

| Milestone | Status |
|-----------|--------|
| Documentation | ✅ Complete |
| Three-layer architecture | ✅ Implemented |
| Pattern library (14 patterns) | ✅ Complete |
| UI with onboarding | ✅ Complete |
| Multi-provider support (OpenAI + Claude) | ✅ Complete |
| End-to-end flow | ⏳ Needs API key to verify |

---

## Principles

1. **Docs are the source of truth** — If docs and code disagree, the code is wrong
2. **Three-layer separation** — Arnold, Nedry, Raptor fail independently
3. **Pattern-first** — 80% deterministic assembly, 20% generative
4. **Human-in-the-loop** — No code without explicit approval

---

## License

MIT — See `LICENSE` for details.
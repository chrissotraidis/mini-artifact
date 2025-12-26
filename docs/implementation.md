# IMPLEMENTATION.md — Technical Guide

Owner: Chris Sotraidis
Created time: December 22, 2025 5:34 PM

# Mini Artifact — Technical Implementation Guide

**Version:** 0.1.0

**Status:** Draft

**Last Updated:** 2025-12-22

---

## 1. Technology Stack

### Frontend

| Technology | Purpose |
| --- | --- |
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Zustand** | State management |
| **TailwindCSS** | Styling |
| **Vite** | Build tool |

### Backend/Services

| Technology | Purpose |
| --- | --- |
| **OpenAI API** | LLM inference (GPT-4o, GPT-4 Turbo) |
| **Anthropic API** | LLM inference (Claude Sonnet, Opus) |
| **Vercel Edge Functions** | API proxy |

### Development

| Technology | Purpose |
| --- | --- |
| **Vitest** | Testing |
| **ESLint + Prettier** | Code quality |

---

## 2. Project Structure

```
mini-artifact/
├── docs/                    # Documentation (this folder)
│   ├── [README.md](http://README.md)
│   ├── [SPEC.md](http://SPEC.md)
│   ├── [ARCHITECTURE.md](http://ARCHITECTURE.md)
│   ├── [COMPONENTS.md](http://COMPONENTS.md)
│   ├── [WORKFLOW.md](http://WORKFLOW.md)
│   ├── [IMPLEMENTATION.md](http://IMPLEMENTATION.md)
│   └── [DECISIONS.md](http://DECISIONS.md)
│
├── src/
│   ├── components/          # React UI components
│   │   ├── ChatPanel.tsx
│   │   ├── SpecPanel.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── InputBar.tsx
│   │   └── Layout.tsx
│   │
│   ├── engine/              # Core engine components
│   │   ├── arnold/          # Mini-Arnold (Spec Builder)
│   │   │   ├── index.ts
│   │   │   ├── prompts.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── nedry/           # Mini-Nedry (Orchestrator)
│   │   │   ├── index.ts
│   │   │   ├── validator.ts
│   │   │   ├── router.ts
│   │   │   └── types.ts
│   │   │
│   │   └── raptor/          # Mini-Raptor (Composer)
│   │       ├── index.ts
│   │       ├── assembler.ts
│   │       ├── patterns/    # Pattern library
│   │       │   ├── app-shell.ts
│   │       │   ├── view-list.ts
│   │       │   ├── view-form.ts
│   │       │   └── index.ts
│   │       └── types.ts
│   │
│   ├── store/               # Zustand state
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── api/                 # API layer
│   │   ├── providers/       # Multi-provider support
│   │   │   ├── index.ts     # Router + key management
│   │   │   ├── openai.ts    # OpenAI adapter
│   │   │   └── anthropic.ts # Anthropic adapter
│   │   ├── openai.ts        # (legacy, deprecated)
│   │   └── types.ts
│   │
│   ├── utils/               # Utilities
│   │   ├── templates.ts     # Handlebars helpers
│   │   ├── logger.ts        # Centralized logging
│   │   └── storage.ts       # Session storage
│   │
│   ├── types/               # TypeScript types
│   │   ├── index.ts         # Main type exports
│   │   └── llm.ts           # LLM provider types
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── api/                     # Vercel Edge Functions
│   └── chat.ts              # Multi-provider LLM proxy
│
├── tests/
│   ├── arnold.test.ts
│   ├── nedry.test.ts
│   └── raptor.test.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env.local               # API keys (gitignored)
```

---

## 3. State Management

### Store Definition

```tsx
// src/store/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Conversation
  messages: Message[];
  addMessage: (msg: Message) => void;
  
  // Specification
  currentSpec: Specification | null;
  setSpec: (spec: Specification) => void;
  specHistory: Specification[];
  
  // Build
  buildResult: BuildResult | null;
  setBuildResult: (result: BuildResult) => void;
  buildStatus: 'idle' | 'building' | 'success' | 'error';
  
  // Workflow
  phase: WorkflowPhase;
  setPhase: (phase: WorkflowPhase) => void;
  
  // Errors
  errors: AppError[];
  addError: (error: AppError) => void;
  clearErrors: () => void;
  
  // Actions
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      messages: [],
      addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
      
      currentSpec: null,
      setSpec: (spec) => set(s => ({ 
        currentSpec: spec,
        specHistory: [...s.specHistory, spec]
      })),
      specHistory: [],
      
      buildResult: null,
      setBuildResult: (result) => set({ buildResult: result }),
      buildStatus: 'idle',
      
      phase: 'idle',
      setPhase: (phase) => set({ phase }),
      
      errors: [],
      addError: (error) => set(s => ({ errors: [...s.errors, error] })),
      clearErrors: () => set({ errors: [] }),
      
      reset: () => set({
        messages: [],
        currentSpec: null,
        specHistory: [],
        buildResult: null,
        buildStatus: 'idle',
        phase: 'idle',
        errors: []
      })
    }),
    { name: 'mini-artifact-store' }
  )
);
```

---

## 3.5 LLM Provider Architecture

### Multi-Provider Support

The app supports multiple LLM providers through a unified abstraction layer.

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo |
| Anthropic | Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3 Opus |

### Unified Types

```typescript
// src/types/llm.ts
type Provider = 'openai' | 'anthropic';

interface LLMRequest {
  provider: Provider;
  model: string;
  messages: LLMMessage[];
  maxTokens?: number;
  responseFormat?: { type: 'json_object' } | { type: 'text' };
}

interface LLMResponse {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}
```

### Provider Routing

```typescript
// src/api/providers/index.ts
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  // 1. Try Edge Function proxy (production)
  // 2. Fall back to direct API (local dev)
}
```

### API Key Management

Keys are stored per-provider in localStorage:
- `mini-artifact-openai-key`
- `mini-artifact-anthropic-key`

### Edge Function

The `api/chat.ts` Edge Function routes to providers based on request:

```typescript
// Request shape
{ provider: 'openai' | 'anthropic', model: string, messages: [...] }

// Response shape
{ content: string, usage?: { input: number, output: number } }
```

---

## 4. Core Engine Implementation

### Mini-Arnold

```tsx
// src/engine/arnold/index.ts
import { callLLM } from '../../api/providers';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

export async function processMessage(
  input: ArnoldInput
): Promise<ArnoldOutput> {
  const response = await callLLM({
    provider: input.provider,
    model: input.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...input.conversationHistory,
      { role: 'user', content: buildUserPrompt(input) }
    ],
    responseFormat: { type: 'json_object' }
  });
  
  const parsed = JSON.parse(response.text);
  
  return {
    type: parsed.type,
    question: parsed.question,
    spec: parsed.spec,
    confidence: parsed.confidence
  };
}
```

### Mini-Nedry

```tsx
// src/engine/nedry/index.ts
import { processMessage } from '../arnold';
import { build } from '../raptor';
import { validateSpec } from './validator';
import { matchPatterns } from './router';

export async function handleInput(input: NedryInput): Promise<NedryOutput> {
  const { type, payload, currentState } = input;
  
  switch (type) {
    case 'user_message':
      const arnoldResult = await processMessage({
        message: payload,
        conversationHistory: currentState.messages,
        currentSpec: currentState.currentSpec
      });
      
      if (arnoldResult.type === 'question') {
        return {
          action: { type: 'display_question', question: arnoldResult.question! },
          stateUpdate: { phase: 'gathering' }
        };
      }
      
      return {
        action: { type: 'update_ui', update: { spec: arnoldResult.spec } },
        stateUpdate: { 
          currentSpec: arnoldResult.spec,
          phase: arnoldResult.confidence > 0.9 ? 'refining' : 'gathering'
        }
      };
      
    case 'build_request':
      const validation = validateSpec(currentState.currentSpec!);
      if (!validation.valid) {
        return {
          action: { type: 'display_error', error: { message: validation.errors[0].message } },
          stateUpdate: { phase: 'error' }
        };
      }
      
      const patterns = matchPatterns(currentState.currentSpec!);
      const buildResult = await build({
        spec: currentState.currentSpec!,
        patterns
      });
      
      return {
        action: { type: 'update_ui', update: { buildResult } },
        stateUpdate: { buildResult, phase: 'complete', buildStatus: 'success' }
      };
  }
}
```

### Mini-Raptor

```tsx
// src/engine/raptor/index.ts
import { getPattern } from './patterns';
import { renderTemplate } from '../../utils/templates';

export async function build(input: RaptorInput): Promise<RaptorOutput> {
  const { spec, patterns } = input;
  
  // Assemble patterns
  const assembled = assemblePatterns(patterns, spec);
  
  // Wrap in app shell
  const shell = getPattern('app-shell');
  const html = renderTemplate(shell.template.html, {
    title: [spec.meta.name](http://spec.meta.name),
    content: assembled.html,
    styles: assembled.css,
    scripts: assembled.js
  });
  
  return {
    success: true,
    html,
    css: '',  // Inlined
    javascript: '',  // Inlined
    manifest: {
      specId: spec.version,
      builtAt: new Date().toISOString(),
      patternsUsed: [patterns.map](http://patterns.map)(p => p.patternId),
      deltasGenerated: []
    }
  };
}

function assemblePatterns(patterns: PatternReference[], spec: Specification) {
  const html: string[] = [];
  const css: string[] = [];
  const js: string[] = [];
  
  for (const ref of patterns) {
    const pattern = getPattern(ref.patternId);
    const context = buildContext(ref, spec);
    
    html.push(renderTemplate(pattern.template.html, context));
    css.push(pattern.template.css);
    js.push(renderTemplate(pattern.template.js, context));
  }
  
  return {
    html: html.join('\n'),
    css: [...new Set(css)].join('\n'),  // Dedupe
    js: js.join('\n')
  };
}
```

---

## 5. Pattern Example

```tsx
// src/engine/raptor/patterns/view-list.ts
export const viewList: Pattern = {
  id: 'view-list',
  name: 'List View',
  category: 'view',
  inputs: [
    { name: 'entity', type: 'entity', required: true },
    { name: 'properties', type: 'property[]', required: true }
  ],
  template: {
    html: `
      <div class="list-view" data-entity="[entity.name](http://entity.name)">
        <h2>entity.names</h2>
        <ul class="item-list" id="[entity.id](http://entity.id)-list">
          <!-- Items render here -->
        </ul>
        <button class="add-btn" onclick="showForm('[entity.id](http://entity.id)')">+ Add [entity.name](http://entity.name)</button>
      </div>
    `,
    css: `
      .list-view { padding: 1rem; }
      .item-list { list-style: none; padding: 0; }
      .item-list li { padding: 0.5rem; border-bottom: 1px solid #eee; }
      .add-btn { margin-top: 1rem; padding: 0.5rem 1rem; }
    `,
    js: `
      function renderList(entityId, items) {
        const list = document.getElementById(entityId + '-list');
        list.innerHTML = [items.map](http://items.map)(item => 
          \`<li data-id="\${[item.id](http://item.id)}">\${renderItem(item)}</li>\`
        ).join('');
      }
    `
  },
  dependencies: ['style-base', 'state-manager']
};
```

---

## 6. API Proxy

```tsx
// api/chat.ts (Vercel Edge Function)
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { messages, response_format } = await req.json();
  
  const response = await [openai.chat](http://openai.chat).completions.create({
    model: 'gpt-4o',
    messages,
    response_format,
    temperature: 0  // Determinism
  });
  
  return new Response(
    JSON.stringify({ content: response.choices[0].message.content }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

## 7. Build & Deploy

### Development

```bash
npm install
npm run dev
```

### Production

```bash
npm run build
vercel deploy
```

### Environment Variables

Mini Artifact supports two ways to configure the OpenAI API key, in priority order:

1. **User Configuration (Runtime)**: Stored in `localStorage` via the Settings UI. This is the primary method for end-users.
2. **Environment Variable (Dev)**: Fallback for local development.

```bash
# .env.local (Optional Fallback)
VITE_OPENAI_API_KEY=sk-...
```

> **Note**: The client-side application securely passes this key to the engine layers. It is never exposed in the generated output.

---

## 8. Testing Strategy

| Layer | Test Type | Focus |
| --- | --- | --- |
| Arnold | Unit | Prompt parsing, spec generation |
| Nedry | Unit + Integration | Routing, validation |
| Raptor | Unit | Pattern assembly, determinism |
| UI | E2E | User workflow |

```tsx
// tests/raptor.test.ts
import { build } from '../src/engine/raptor';

describe('Mini-Raptor', () => {
  it('produces deterministic output', async () => {
    const spec = createTestSpec();
    const result1 = await build({ spec, patterns: [] });
    const result2 = await build({ spec, patterns: [] });
    
    expect(result1.html).toBe(result2.html);
  });
});
```

---

## Changelog

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1.0 | 2025-12-22 | Chris Sotraidis | Initial implementation guide |
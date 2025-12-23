# ARCHITECTURE.md — System Architecture

Owner: Chris Sotraidis
Created time: December 22, 2025 5:27 PM

**Version:** 0.1.0

**Status:** Draft

**Last Updated:** 2025-12-22

---

## 1. Architectural Philosophy

### The Core Insight

Most AI tools collapse everything into a single loop: **prompt in → code out**.

That compression feels fast. It's also the source of most failures.

Mini Artifact deliberately separates three concerns that other tools collapse:

1. **Documentation** — Capturing *what* and *why*
2. **Orchestration** — Managing *when* and *where*
3. **Composition** — Executing *how*

Understanding *why* they're separate—not just *that* they're separate—is what makes it possible to work on one part without breaking the others.

---

## 2. The Three-Layer Architecture

### Layer Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Chat     │  │   Spec     │  │  Preview   │  │  Controls  │        │
│  │   Panel    │  │   Panel    │  │   Panel    │  │   Panel    │        │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘        │
└────────┼───────────────┼───────────────┼───────────────┼────────────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION STATE                                    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  { messages, spec, buildResult, status, errors }               │    │
│  └────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┬────┘
                                                                     │
                                                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CORE ENGINE LAYERS                                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  DOCUMENTATION LAYER (Mini-Arnold)                             │    │
│  │  • Intent parsing                                              │    │
│  │  • Clarifying questions                                        │    │
│  │  • Spec generation                                             │    │
│  │  • Output: JSON Specification                                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  ORCHESTRATION LAYER (Mini-Nedry)                              │    │
│  │  • Spec validation                                             │    │
│  │  • Pattern matching                                            │    │
│  │  • Workflow coordination                                       │    │
│  │  • Output: Build Instructions                                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              │                                          │
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  COMPOSITION LAYER (Mini-Raptor)                               │    │
│  │  • Pattern retrieval                                           │    │
│  │  • Code assembly                                               │    │
│  │  • Delta generation                                            │    │
│  │  • Output: Working Application                                 │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2A. Logic Wiring & Subagents

The architecture is implemented as a set of cooperating logical agents ("subagents"), wired together by the orchestration layer.

### 1. The Documentation Agent (Arnold)
- **Role**: Understands intent, asks questions, generates specs.
- **Codebase**: `src/engine/arnold`
- **Dependency**: Requires OpenAI API Key.
    - Key is retrieved from `localStorage` via `openai.ts`.
    - If missing, Arnold halts and requests configuration.
- **Input**: Natural language user message + Current Spec.
- **Output**: JSON Specification or Clarifying Question.

### 2. The Orchestration Agent (Nedry)
- **Role**: The router and state manager. Decides *who* acts next.
- **Codebase**: `src/engine/nedry`
- **Logic Flow**:
    1. Receives input from UI (`handleInput`).
    2. Routes to **Arnold** to interpret intent.
    3. Validates the resulting spec.
    4. Routes to **Raptor** when a build is requested.

### 3. The Builder Agent (Raptor)
- **Role**: Deterministic assembler.
- **Codebase**: `src/engine/raptor`
- **Input**: Validated Specification + Pattern Library.
- **Output**: Functional HTML/CSS/JS.

### Data Flow

```mermaid
graph TD
    UI[Controls / Settings] -->|API Key| Store[LocalStorage]
    
    UI -->|User Message| Nedry[Orchestrator (Nedry)]
    
    Nedry -->|Context| Arnold[Documentation (Arnold)]
    Arnold -->|Get Key| Store
    Arnold -->|Request| OpenAI[OpenAI API]
    OpenAI -->|Response| Arnold
    Arnold -->|Spec Update| Nedry
    
    Nedry -->|Update State| State[App State]
    
    UI -->|Generate Command| Nedry
    Nedry -->|Valid Spec| Raptor[Builder (Raptor)]
    Raptor -->|Code Patterns| Output[Build Result]
```

---

## 3. Why Documentation Must Be Separate

### The Problem

If intent lives only in prompts, it dies after execution.

Every AI tool that treats prompts as disposable inputs faces the same problem:

- No memory of *why* the system was built
- No record of decisions
- No foundation for iteration
- When something breaks, nothing to trace back to
- When teams scale, nothing to share

### The Solution

Documentation exists to make intent **durable**.

A document isn't a summary of what was built. It's the *source* of what gets built. It captures constraints, rationale, and structure in a form that survives time, handoffs, and change.

### What Breaks Without It

When documentation is collapsed into orchestration or generation:

- Intent becomes implicit
- Implicit intent cannot be versioned
- Implicit intent cannot be validated
- Implicit intent cannot be evolved
- It just disappears into the model's context window

> **Separation Principle:** Intent must be explicit and persistent. Documents are how intent survives automation.
> 

---

## 4. Why Orchestration Must Be Separate

### The Problem

Orchestration is the layer that *decides*:

- What a document implies
- Which systems should act
- How to sequence work
- How to preserve context across steps

Most AI tools skip this layer entirely. They route every request directly to a generative model. The model guesses what you meant, generates output, and hopes for the best.

### When This Fails

This works for simple, one-shot tasks. It fails for anything with:

| Concern | What It Needs | What Prompts Provide |
| --- | --- | --- |
| **State** | Persistence across steps | Nothing |
| **Memory** | Context across sessions | Token window only |
| **Branching** | Decision routing | None |
| **Validation** | Checkpoint before proceed | Hope |

### What Breaks Without It

Without orchestration:

- Errors compound silently
- No mechanism to catch drift
- No ability to route work intelligently
- No way to coordinate multiple capabilities

> **Separation Principle:** Coordination requires state that prompts can't hold. Orchestration is how intent becomes action without losing context.
> 

---

## 5. Why Deterministic Composition Must Be Separate

### The Non-Obvious Fact

**Most software is not unique.**

- Authentication flows
- CRUD operations
- Dashboards
- Form validation
- State transitions
- Notification systems

These patterns repeat across thousands of applications with minor variations.

### The Problem with Generating Everything

Generative AI is powerful, but:

- **Expensive** — Tokens cost money
- **Unpredictable** — Same prompt → different outputs
- **Slow** — Inference takes time

Using it to reinvent login screens is like hiring a novelist to write grocery lists: technically possible, wildly inefficient, prone to strange results.

### The Solution: Patterns + Deltas

Deterministic composition separates *repetition* from *novelty*:

| Type | Approach | Cost |
| --- | --- | --- |
| **80% — Known patterns** | Assemble from tested templates | Zero inference |
| **20% — Novel requirements** | Generate with AI | Token inference |

> **Separation Principle:** Repetition should be predictable. Generative power should be reserved for genuine novelty.
> 

---

## 6. What Happens When Layers Collapse

When documentation, orchestration, and composition collapse into a single loop:

### Intent Becomes Disposable

- No persistent record of what was meant
- Only what was generated
- Debugging means re-prompting and hoping
- Iteration means starting over

### Context Becomes Fragile

- Every request is treated as independent
- State leaks between sessions
- System can't remember what it did or why

### Output Becomes Inconsistent

- Same input produces different results
- Tested patterns get regenerated from scratch
- New bugs introduced each time
- Reliability drops as complexity increases

### Errors Become Invisible

- Without validation layers, mistakes propagate silently
- System can't distinguish between "working" and "appears to be working"

> This is why vibe-coded apps feel magical for ten minutes and then collapse under real use. The speed comes from skipping the layers that make systems trustworthy.
> 

---

## 7. Component Boundaries

### Interface Contracts

```tsx
// Mini-Arnold → Mini-Nedry
interface Specification {
  version: string;
  app: {
    name: string;
    description: string;
  };
  entities: Entity[];
  views: View[];
  actions: Action[];
  constraints: Constraint[];
}

// Mini-Nedry → Mini-Raptor
interface BuildInstructions {
  specId: string;
  patterns: PatternReference[];
  deltas: DeltaRequirement[];
  order: string[];
  config: BuildConfig;
}

// Mini-Raptor → Output
interface BuildResult {
  success: boolean;
  html: string;
  css: string;
  javascript: string;
  errors?: string[];
  warnings?: string[];
}
```

### Failure Isolation

| Component | Primary Failure Mode | What Mixing Causes |
| --- | --- | --- |
| **Mini-Arnold** | Intent becomes implicit and disposable | No foundation for iteration or debugging |
| **Mini-Nedry** | State leaks and context fragments | Unpredictable behavior, silent error propagation |
| **Mini-Raptor** | Inconsistent output, wasted inference | Fragile systems that work by accident |

---

## 8. State Management

### Application State Shape

```tsx
interface AppState {
  // Conversation state
  messages: Message[];
  conversationPhase: 'gathering' | 'refining' | 'complete';
  
  // Specification state
  currentSpec: Specification | null;
  specHistory: Specification[];
  specValidation: ValidationResult | null;
  
  // Build state
  buildInstructions: BuildInstructions | null;
  buildResult: BuildResult | null;
  buildStatus: 'idle' | 'building' | 'success' | 'error';
  
  // UI state
  activePanel: 'chat' | 'spec' | 'preview';
  errors: AppError[];
}
```

---

## 9. Technology Choices

### Frontend

| Technology | Purpose | Rationale |
| --- | --- | --- |
| **React** | UI framework | Component model matches architecture |
| **TypeScript** | Type safety | Enforces interface contracts |
| **Zustand** | State management | Lightweight, supports separation |
| **TailwindCSS** | Styling | Rapid development, consistent design |

### Backend/Services

| Technology | Purpose | Rationale |
| --- | --- | --- |
| **OpenAI API** | LLM inference | Spec building, delta generation |
| **Vercel/Netlify** | Hosting | Simple deployment for static + serverless |
| **Edge Functions** | API routes | Secure API key handling |

### Development

| Technology | Purpose | Rationale |
| --- | --- | --- |
| **Vite** | Build tool | Fast development, clean output |
| **Vitest** | Testing | Native TypeScript, fast |
| **ESLint + Prettier** | Code quality | Consistent style |

---

## 10. Security Considerations

### API Key Protection

- Never expose OpenAI API key to client
- Use serverless functions as proxy
- Rate limiting on API routes

### Generated Code Safety

- Sandbox generated code in iframe
- No `eval()` of user content
- Content Security Policy headers

### Data Handling

- No server-side persistence of user data
- Session storage only
- Clear data on session end

---

## Document References

- [`SPEC.md`](http://SPEC.md) — Functional requirements
- [`COMPONENTS.md`](http://COMPONENTS.md) — Detailed component specifications
- [`WORKFLOW.md`](http://WORKFLOW.md) — User-facing workflow
- [`IMPLEMENTATION.md`](http://IMPLEMENTATION.md) — Build guide
- [`DECISIONS.md`](http://DECISIONS.md) — Architectural decisions

---

## Changelog

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1.0 | 2025-12-22 | Chris Sotraidis | Initial architecture |
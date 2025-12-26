# DECISIONS.md — Decision Log

Owner: Chris Sotraidis
Created time: December 22, 2025 5:35 PM

**Version:** 0.1.0

**Status:** Active

**Last Updated:** 2025-12-22

---

This document records architectural and design decisions for Mini Artifact. Each decision includes context, options considered, the chosen approach, and rationale.

---

## Decision Template

```markdown
## DEC-XXX: [Title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded  
**Deciders:** [Names]

### Context
[What is the issue or question?]

### Options Considered
1. Option A - [description]
2. Option B - [description]
3. Option C - [description]

### Decision
[Which option was chosen?]

### Rationale
[Why was this option chosen?]

### Consequences
[What are the implications?]
```

---

## Decisions

---

## DEC-001: Three-Layer Architecture

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

How should Mini Artifact structure its core engine? Most AI coding tools use a single prompt-response loop, which is simple but fragile.

### Options Considered

1. **Single loop** — Direct prompt to LLM, return code
2. **Two layers** — Orchestration + Generation
3. **Three layers** — Documentation + Orchestration + Composition (Artifact model)

### Decision

Three-layer architecture: Mini-Arnold (Documentation), Mini-Nedry (Orchestration), Mini-Raptor (Composition).

### Rationale

- Mirrors the full Artifact architecture, making Mini Artifact a true teaching implementation
- Separates concerns so each can fail independently
- Enables deterministic output for pattern-based code
- Preserves intent in explicit specifications

### Consequences

- More complex implementation than single loop
- Requires clear interface contracts between layers
- Makes debugging easier (can trace issues to specific layer)

---

## DEC-002: Web-Only Output

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

What output format should Mini-Raptor generate? Full Artifact targets Rails; what should Mini Artifact target?

### Options Considered

1. **Rails** — Match full Artifact
2. **Next.js** — Modern React framework
3. **Plain HTML/CSS/JS** — No framework, runs in browser

### Decision

Plain HTML/CSS/JavaScript that runs directly in an iframe.

### Rationale

- Simplest possible output—no build step, no server
- Immediate preview in browser
- Teaches the concepts without framework complexity
- Generated code is inspectable and understandable

### Consequences

- Limited to client-side functionality (no database, auth, etc.)
- State management via localStorage only
- Not representative of "real" production apps
- Good for demos and teaching, not production use

---

## DEC-003: React + Zustand for UI

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

What frontend stack for the Mini Artifact application itself (not the generated output)?

### Options Considered

1. **Vanilla JS** — No framework
2. **Vue 3** — Progressive framework
3. **React + Zustand** — Component model + lightweight state
4. **Svelte** — Compile-time framework

### Decision

React 18 with Zustand for state management.

### Rationale

- React's component model maps well to the panel-based UI
- Zustand is minimal, TypeScript-native, supports persistence
- Widely known, easy for contributors to understand
- Good ecosystem for rapid development

### Consequences

- Bundle size larger than Vanilla JS
- Requires build step (Vite)
- State management patterns must be documented

---

## DEC-004: OpenAI API for LLM

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

Which LLM provider for spec building and delta generation?

### Options Considered

1. **OpenAI (GPT-4o)** — Best quality, reliable API
2. **Anthropic (Claude)** — Good quality, different strengths
3. **Local (Ollama)** — Privacy, no cost, variable quality
4. **Multiple providers** — Flexibility, complexity

### Decision

OpenAI GPT-4o with temperature=0 for deterministic output.

### Rationale

- Structured output (JSON mode) works reliably
- Temperature=0 provides consistency
- Well-documented API
- Good balance of quality and speed

### Consequences

- Requires API key (cost)
- Depends on external service
- Must proxy through edge function (security)
- Future: could abstract to support multiple providers

---

## DEC-005: Session-Only Persistence

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

Should Mini Artifact persist user data? If so, how?

### Options Considered

1. **No persistence** — Data lost on page close
2. **Session storage** — Data persists during session
3. **Local storage** — Data persists across sessions
4. **Server-side** — Requires auth, database

### Decision

Session storage for conversation and spec; localStorage for Zustand store.

### Rationale

- No backend required
- Privacy: no user data on servers
- Simple implementation
- Users can export if they want to save

### Consequences

- Work lost if user clears browser data
- No collaboration features
- No account system needed

---

## DEC-006: Handlebars for Templates

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

How should Mini-Raptor patterns define their templates?

### Options Considered

1. **String concatenation** — Simple, verbose
2. **Template literals** — JS native, limited logic
3. **Handlebars** — Logic-less templates, familiar syntax
4. **JSX** — React-native, complex for this use case

### Decision

Handlebars templates for pattern definitions.

### Rationale

- Clean separation of template and logic
- Familiar `variable` syntax
- Built-in helpers for loops and conditionals
- Templates are readable and inspectable

### Consequences

- Additional dependency
- Learning curve for complex templates
- Pre-compilation possible for performance

---

## DEC-007: Pattern Library Size

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

How Mini patterns should the initial Mini Artifact library include?

### Options Considered

1. **Minimal (5)** — Just essentials
2. **Moderate (15)** — Cover common use cases
3. **Comprehensive (30+)** — Handle edge cases

### Decision

15 patterns for initial release, covering layout, views, actions, and utilities.

### Rationale

- Enough to build simple CRUD apps
- Not so Mini that patterns are hard to understand
- Can expand based on usage patterns
- Demonstrates the concept without overwhelming

### Consequences

- Some user requests will require delta generation
- Pattern gaps become apparent in testing
- Clear path for expansion

---

## DEC-008: Runtime API Key Management

**Date:** 2025-12-22

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

How should users configure their OpenAI API key? Environment variables require technical knowledge and restarts.

### Options Considered

1. **Environment variable only** — `.env.local` file, requires restart
2. **UI-based input** — Settings modal, stored in localStorage
3. **Both** — UI takes priority, env as fallback

### Decision

Both: UI-based configuration via Settings modal, with localStorage storage. Environment variable serves as fallback.

### Rationale

- Non-technical users can configure via UI
- No restart required to change key
- Key stays in browser (privacy)
- Dev mode still works with `.env.local`

### Consequences

- Key visible in browser localStorage (acceptable for PoC)
- Must check both sources on each request
- Onboarding modal guides first-time users

---

## DEC-010: OpenAI API Error Recovery Strategy

**Date:** 2025-12-23

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

The app was experiencing immediate rate limiting errors on first API request, causing confusion between temporary rate limits and account-level quota/billing issues.

### Options Considered

1. **Simple retry** — Retry N times with fixed delay
2. **Exponential backoff** — Retry with increasing delays
3. **Error classification + backoff** — Parse error body to distinguish error types, then retry only on temporary limits

### Decision

Exponential backoff with error classification and concurrency guard.

### Rationale

- OpenAI returns different 429 errors (rate_limit_exceeded vs insufficient_quota)
- Users need clear feedback to distinguish temporary issues from account problems
- Exponential backoff (1s, 2s, 4s) respects OpenAI's rate limits
- Concurrency guard prevents duplicate requests

### Consequences

- More robust error handling
- Users see specific messages: "Quota Exceeded" vs "Rate Limited"
- Console logs help debug API issues
- Retry logic adds small complexity to the request flow

---

## DEC-011: Multi-Provider LLM Architecture

**Date:** 2025-12-25

**Status:** Accepted

**Deciders:** Chris Sotraidis

### Context

The app only supported OpenAI as the LLM provider. Users requested support for Anthropic Claude as an alternative, requiring architectural changes to support multiple providers.

### Options Considered

1. **Add Claude as separate code path** — Duplicate API call logic
2. **Provider abstraction layer** — Unified interface with adapters per provider
3. **SDK-based abstraction** — Use LangChain or similar

### Decision

Provider abstraction layer with unified types and per-provider adapters.

### Rationale

- Clean separation of concerns (types, routing, adapters)
- Easy to add future providers (Gemini, Llama, etc.)
- Unified request/response format simplifies Arnold and other consumers
- SDK-based approaches add unnecessary dependencies
- Proxy-first architecture keeps API keys server-side in production

### Implementation

| Component | Purpose |
|-----------|---------|
| `src/types/llm.ts` | Unified types: `Provider`, `LLMRequest`, `LLMResponse` |
| `src/api/providers/index.ts` | Router with proxy-first fallback |
| `src/api/providers/openai.ts` | OpenAI adapter |
| `src/api/providers/anthropic.ts` | Anthropic adapter |
| `api/chat.ts` | Edge Function with multi-provider routing |

### Claude-Specific Handling

- System messages extracted to top-level `system` param
- `max_tokens` required (defaults to 4096)
- Response content blocks flattened to single string

### Consequences

- Store now has `provider` and `model` state (was `aiModel`)
- Settings UI has provider toggle + separate API key inputs
- Edge Function requires `ANTHROPIC_API_KEY` env var for Claude
- Tests updated to mock `callLLM` instead of `callOpenAI`

---

## Future Decisions (To Be Made)

| ID | Topic | Status |
| --- | --- | --- |
| DEC-009 | Spec versioning approach | Pending |
| DEC-012 | Pattern conflict resolution | Pending |
| DEC-013 | CI/CD pipeline | Pending |
| DEC-014 | Accessibility requirements | Pending |

---

## Changelog

| Version | Date | Changes |
| --- | --- | --- |
| 0.1.0 | 2025-12-22 | Initial 7 decisions documented |
| 0.1.1 | 2025-12-22 | Added DEC-008: Runtime API Key Management |
| 0.1.2 | 2025-12-23 | Added DEC-010: OpenAI API Error Recovery Strategy |
| 0.1.3 | 2025-12-25 | Added DEC-011: Multi-Provider LLM Architecture |
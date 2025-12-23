# SPEC.md — Master Specification

Owner: Chris Sotraidis
Created time: December 22, 2025 5:27 PM

**Version:** 0.1.0

**Status:** Draft

**Last Updated:** 2025-12-22

---

## 1. Executive Summary

Mini Artifact is a **web-based, miniature implementation** of the Artifact Interaction Engine. It demonstrates that:

1. **Specification-driven development works** — A structured document can be the source of truth for generated software
2. **Three-layer separation is practical** — Documentation, orchestration, and composition can operate as distinct, coordinated concerns
3. **Deterministic composition reduces complexity** — Patterns can replace inference for repetitive structures

This specification defines *what* Mini Artifact does, *why* each capability exists, and *how* success is measured.

---

## 2. Problem Statement

### The Problem with Current AI Coding Tools

Most AI coding tools collapse planning, execution, and validation into a single prompt-response loop:

- **Intent is disposable** — Prompts disappear after execution, leaving no record of decisions
- **Context is fragile** — Each request is treated as independent; state leaks between sessions
- **Output is inconsistent** — The same input produces different results
- **Errors are invisible** — Without validation layers, mistakes propagate silently

### Why This Matters

This compression feels fast but produces systems that:

- Work magically for demos, then collapse under real use
- Cannot be debugged because there's no trace of intent
- Cannot be maintained because there's no memory of why things were built

### What Mini Artifact Proves

By separating concerns and treating documentation as the source of truth, Mini Artifact demonstrates that AI-assisted software can be:

- **Traceable** — Every output maps to a specification
- **Predictable** — Patterns produce consistent results
- **Evolvable** — Changes to specs cascade through the system

---

## 3. Goals and Non-Goals

### Goals

| Goal | Success Metric |
| --- | --- |
| Prove three-layer architecture works | End-to-end flow completes without layer leakage |
| Demonstrate spec-driven development | Spec changes produce predictable output changes |
| Show deterministic composition | Same spec + same patterns = identical output |
| Create teaching reference | New developers understand the system in < 30 min |
| Enable experimentation | New patterns can be added without system changes |

### Non-Goals

- **Production deployment** — This is a proof of concept, not production software
- **Multi-language support** — Web-only (HTML/CSS/JS output)
- **User authentication** — No accounts, no persistence beyond session
- **Real-time collaboration** — Single-user only
- **Token optimization** — Clarity over efficiency for this implementation
- **Pattern marketplace** — Fixed pattern library, no user contributions

---

## 4. System Overview

### Core Loop

```
User Intent → Mini-Arnold (Spec Builder) → Mini-Nedry (Orchestrator) → Mini-Raptor (Composer) → Working App
```

### The Three Layers

| Layer | Component | Responsibility | Input | Output |
| --- | --- | --- | --- | --- |
| Documentation | **Mini-Arnold** | Convert natural language to structured spec | User messages | JSON specification |
| Orchestration | **Mini-Nedry** | Route intent, validate specs, manage workflow | JSON specification | Validated spec + build instructions |
| Composition | **Mini-Raptor** | Assemble patterns into working code | Build instructions | HTML/CSS/JS application |

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MINI ARTIFACT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │   USER   │───▶│ MINI-ARNOLD  │───▶│ MINI-NEDRY   │           │
│  │  INPUT   │    │ (Spec Build) │    │ (Orchestrate)│           │
│  └──────────┘    └──────────────┘    └──────┬───────┘           │
│                                              │                   │
│                                              ▼                   │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │  PREVIEW │◀───│ MINI-RAPTOR  │◀───│   PATTERN    │           │
│  │  OUTPUT  │    │  (Compose)   │    │   LIBRARY    │           │
│  └──────────┘    └──────────────┘    └──────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements

### FR-1: Spec Building (Mini-Arnold)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1.1 | Accept natural language input describing an application | Must Have |
| FR-1.2 | Ask clarifying questions to complete the spec | Must Have |
| FR-1.3 | Generate structured JSON specification | Must Have |
| FR-1.4 | Display spec as it builds (real-time feedback) | Should Have |
| FR-1.5 | Validate spec completeness before proceeding | Must Have |
| FR-1.6 | Allow manual spec editing | Should Have |

### FR-2: Orchestration (Mini-Nedry)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-2.1 | Route user input to appropriate handler | Must Have |
| FR-2.2 | Validate spec against schema | Must Have |
| FR-2.3 | Identify required patterns from spec | Must Have |
| FR-2.4 | Manage workflow state across steps | Must Have |
| FR-2.5 | Handle errors gracefully with user feedback | Must Have |
| FR-2.6 | Log all routing decisions | Should Have |

### FR-3: Composition (Mini-Raptor)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-3.1 | Accept validated spec and pattern list | Must Have |
| FR-3.2 | Assemble patterns into coherent output | Must Have |
| FR-3.3 | Generate valid HTML/CSS/JS | Must Have |
| FR-3.4 | Handle pattern conflicts/overlaps | Must Have |
| FR-3.5 | Support custom "delta" generation for gaps | Should Have |
| FR-3.6 | Produce deterministic output (same input = same output) | Must Have |

### FR-4: User Interface

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-4.1 | Chat-style input for describing intent | Must Have |
| FR-4.2 | Spec preview panel showing JSON structure | Must Have |
| FR-4.3 | Live preview of generated application | Must Have |
| FR-4.4 | "Generate" button to trigger build | Must Have |
| FR-4.5 | Error display with actionable guidance | Must Have |
| FR-4.6 | Export generated code as downloadable file | Should Have |

---

## 6. Non-Functional Requirements

### Performance

- Spec generation: < 5 seconds for simple applications
- Pattern assembly: < 2 seconds for applications with ≤ 10 patterns
- Preview render: < 1 second after code generation

### Reliability

- System recovers gracefully from API failures
- Invalid specs produce clear error messages, not crashes
- State is preserved across browser refresh (session storage)

### Security

- No user data is persisted to server
- Generated code is sandboxed in iframe
- API keys are stored securely (environment variables)

### Maintainability

- Code follows project conventions documented in [IMPLEMENTATION.md](http://IMPLEMENTATION.md)
- All components have unit tests
- All decisions are logged in [DECISIONS.md](http://DECISIONS.md)

---

## 7. Constraints

### Technical Constraints

- **Web-only** — Browser-based, no native app
- **Single LLM provider** — OpenAI API for this implementation
- **No backend persistence** — Session-only state
- **Fixed pattern library** — No dynamic pattern loading

### Scope Constraints

- **Output language** — HTML/CSS/JavaScript only
- **Application complexity** — Simple CRUD-style apps (todo lists, forms, dashboards)
- **Pattern count** — Initial library of 10-15 core patterns

### Time Constraints

- MVP target: 2 weeks
- Full implementation: 4 weeks

---

## 8. Success Criteria

### Demo Scenario

A non-technical user can:

1. Describe a simple application in natural language
2. Answer 2-3 clarifying questions
3. See a valid JSON spec generated
4. Click "Generate" and receive working HTML/CSS/JS
5. Preview the application in-browser
6. Download the generated code

### Technical Validation

- ✅ Same spec produces identical output (determinism)
- ✅ Spec changes produce predictable output changes
- ✅ Each layer can be tested independently
- ✅ Error in one layer doesn't corrupt others
- ✅ Workflow state survives component failures

### Learning Validation

- ✅ New developer understands architecture in < 30 minutes
- ✅ New pattern can be added in < 1 hour
- ✅ Documentation accurately describes system behavior

---

## 9. Open Questions

| Question | Owner | Status |
| --- | --- | --- |
| Should spec support nested components? | TBD | Open |
| How to handle conflicting pattern requirements? | TBD | Open |
| What's the minimum viable pattern library? | TBD | Open |
| Should we support spec versioning? | TBD | Open |

---

## 10. Document References

- [`ARCHITECTURE.md`](http://ARCHITECTURE.md) — Detailed system architecture
- [`COMPONENTS.md`](http://COMPONENTS.md) — Component specifications
- [`WORKFLOW.md`](http://WORKFLOW.md) — User workflow documentation
- [`IMPLEMENTATION.md`](http://IMPLEMENTATION.md) — Technical implementation guide
- [`DECISIONS.md`](http://DECISIONS.md) — Decision log

---

## Changelog

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1.0 | 2025-12-22 | Chris Sotraidis | Initial specification |
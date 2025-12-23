# COMPONENTS.md — Component Specifications

Owner: Chris Sotraidis
Created time: December 22, 2025 5:33 PM

**Version:** 0.1.0

**Status:** Draft

**Last Updated:** 2025-12-22

---

This document specifies the three core components of Mini Artifact:

1. **Mini-Arnold** — Documentation Engine
2. **Mini-Nedry** — Orchestration Layer
3. **Mini-Raptor** — Composition Engine

---

## 1. Mini-Arnold (Documentation Engine)

### Purpose

Mini-Arnold exists because **intent must survive automation**.

Every AI tool that treats prompts as disposable inputs faces the same problem: the system forgets *why* it was built. Mini-Arnold solves this by treating documents as first-class system inputs.

### Responsibilities

- Take user intent (natural language) and convert it into structured specifications
- Build relationships between entities, actions, and requirements
- Ask clarifying questions when intent is ambiguous
- Output documentation in a format that downstream systems can consume
- Maintain the specification as the canonical source of truth

### Interface Contract

```tsx
// Input: User message and conversation history
interface ArnoldInput {
  message: string;
  conversationHistory: Message[];
  currentSpec: Specification | null;
}

// Output: Updated spec or clarifying question
interface ArnoldOutput {
  type: 'question' | 'spec_update' | 'spec_complete';
  question?: string;
  spec?: Specification;
  confidence: number;  // 0-1, how complete the spec is
}

// The specification structure
interface Specification {
  version: string;
  meta: {
    name: string;
    description: string;
    createdAt: string;
  };
  entities: Entity[];
  views: View[];
  actions: Action[];
  patterns: string[];  // Pattern IDs to use
}

interface Entity {
  id: string;
  name: string;
  properties: Property[];
  relationships: Relationship[];
}

interface Property {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  required: boolean;
  options?: string[];  // For enum type
}

interface View {
  id: string;
  name: string;
  type: 'list' | 'form' | 'detail' | 'dashboard';
  entity: string;  // Entity ID
}

interface Action {
  id: string;
  name: string;
  trigger: 'button' | 'form_submit' | 'auto';
  logic: string;  // Description of what happens
}
```

### LLM System Prompt

```markdown
You are Mini-Arnold, a specification engine that converts natural language into structured app specifications.

Your role:
1. Extract entities, properties, actions from user descriptions
2. Identify what information is missing
3. Ask focused clarifying questions (one at a time)
4. Build a valid JSON specification

Rules:
- Never assume unstated requirements
- Ask clarifying questions for ambiguous intent
- Keep questions simple and specific
- Build the spec incrementally
- Mark confidence level (0-1) based on completeness

A spec is complete when:
- All entities have defined properties
- All relationships are explicit
- All actions have clear triggers
- At least one view is defined
```

### What Breaks Without Mini-Arnold

- Specifications become disposable
- Context is re-derived on every request
- No foundation for iteration or debugging

---

## 2. Mini-Nedry (Orchestration Layer)

### Purpose

Mini-Nedry exists because **coordination requires state that prompts cannot hold**.

Mini-Nedry is the traffic controller. It decides what a document implies, which systems should act, how to sequence work, and how to preserve context across steps.

### Responsibilities

- Route user input to Mini-Arnold for specification building
- Validate spec completeness before passing to generation
- Route completed specifications to Mini-Raptor for code assembly
- Coordinate handoffs and manage workflow state
- Handle errors and provide actionable feedback

### Interface Contract

```tsx
interface NedryInput {
  type: 'user_message' | 'spec_update' | 'build_request' | 'error';
  payload: any;
  currentState: AppState;
}

interface NedryOutput {
  action: NedryAction;
  stateUpdate: Partial<AppState>;
  errors?: AppError[];
}

type NedryAction = 
  | { type: 'route_to_arnold'; input: ArnoldInput }
  | { type: 'route_to_raptor'; input: RaptorInput }
  | { type: 'display_question'; question: string }
  | { type: 'display_error'; error: AppError }
  | { type: 'update_ui'; update: UIUpdate };

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completeness: number;  // 0-1
}
```

### Spec Validation Logic

```tsx
function validateSpec(spec: Specification): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required checks
  if (!spec.meta?.name) 
    errors.push({ code: 'MISSING_NAME', message: 'App name required' });
  if (spec.entities.length === 0) 
    errors.push({ code: 'NO_ENTITIES', message: 'At least one entity required' });
  if (spec.views.length === 0) 
    errors.push({ code: 'NO_VIEWS', message: 'At least one view required' });
  
  // Entity validation
  spec.entities.forEach((entity) => {
    if ([entity.properties](http://entity.properties).length === 0) {
      errors.push({ 
        code: 'NO_PROPERTIES', 
        message: `Entity "${[entity.name](http://entity.name)}" has no properties` 
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    completeness: calculateCompleteness(spec)
  };
}
```

### Workflow States

```tsx
type WorkflowPhase = 
  | 'idle'          // No active spec
  | 'gathering'     // Collecting requirements
  | 'refining'      // Spec exists, making changes
  | 'validating'    // Checking spec before build
  | 'building'      // Raptor is assembling
  | 'complete'      // Build finished
  | 'error';        // Something failed
```

### What Breaks Without Mini-Nedry

- Intelligence collapses into single prompt-response loop
- Errors compound silently
- System cannot remember what it did or why
- Unpredictable behavior

---

## 3. Mini-Raptor (Composition Engine)

### Purpose

Mini-Raptor exists because **repetition should be predictable, not generative**.

Most software is not unique. Mini-Raptor separates *what is known* from *what must be discovered*. For known patterns, it assembles from tested templates. For novel requirements, it generates with AI.

### Responsibilities

- Take JSON specifications and assemble working code
- Draw from pattern library of tested, reusable components
- Install patterns without token inference (deterministic)
- Reserve generative flexibility for novel parts (deltas)
- Produce deterministic output (same input = same output)

### Interface Contract

```tsx
interface RaptorInput {
  specId: string;
  spec: Specification;
  patterns: PatternReference[];
  deltas: DeltaRequirement[];
  config: BuildConfig;
}

interface PatternReference {
  patternId: string;
  targetId: string;
  config: Record<string, any>;
}

interface RaptorOutput {
  success: boolean;
  html: string;
  css: string;
  javascript: string;
  manifest: BuildManifest;
  errors?: BuildError[];
}

interface BuildManifest {
  specId: string;
  builtAt: string;
  patternsUsed: string[];
  deltasGenerated: string[];
}
```

### Pattern Library

| Pattern ID | Category | Description |
| --- | --- | --- |
| `app-shell` | layout | Basic HTML structure |
| `navigation` | layout | Top nav bar |
| `view-list` | view | Table/list display |
| `view-form` | view | Create/edit form |
| `view-detail` | view | Single item view |
| `entity-card` | entity | Card component |
| `action-button` | action | Button trigger |
| `action-delete` | action | Delete with confirm |
| `input-text` | utility | Text input |
| `input-checkbox` | utility | Checkbox |
| `input-date` | utility | Date picker |
| `input-select` | utility | Dropdown |
| `state-manager` | utility | localStorage state |
| `style-base` | utility | Base CSS |

### Pattern Structure

```tsx
interface Pattern {
  id: string;
  name: string;
  description: string;
  category: 'layout' | 'entity' | 'view' | 'action' | 'utility';
  inputs: PatternInput[];
  template: {
    html: string;   // Handlebars template
    css: string;
    js: string;
  };
  dependencies: string[];  // Other pattern IDs
}
```

### Assembly Logic

```tsx
function assemblePatterns(patterns: PatternReference[], spec: Specification): Code {
  const html: string[] = [];
  const css: string[] = [];
  const js: string[] = [];
  
  // Sort by dependency order
  const ordered = sortByDependencies(patterns);
  
  ordered.forEach(ref => {
    const pattern = getPattern(ref.patternId);
    const context = buildContext(ref, spec);
    
    html.push(renderTemplate(pattern.template.html, context));
    css.push(renderTemplate(pattern.template.css, context));
    js.push(renderTemplate(pattern.template.js, context));
  });
  
  return { html: html.join('\\n'), css: css.join('\\n'), js: js.join('\\n') };
}
```

### Determinism Guarantees

1. **Pattern templates are static** — Same input = same output
2. **Context derived from spec** — No external state
3. **Delta generation uses fixed prompts** — Temperature = 0
4. **Assembly order is deterministic** — Priority-based sort

### What Breaks Without Mini-Raptor

- Every build is bespoke
- Tokens wasted on solved problems
- Output becomes inconsistent
- Tested patterns regenerated with new bugs

---

## Component Interaction Flow

```
USER ───▶ MINI-NEDRY ───▶ MINI-ARNOLD ───▶ Spec
                │                              │
                ◀──────── Question ◀────────┘
                │
                ▼ (when spec complete)
          MINI-RAPTOR ───▶ Pattern Library
                │                    │
                ◀──── Templates ────┘
                │
                ▼
          BUILD OUTPUT ───▶ PREVIEW
```

---

## Changelog

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1.0 | 2025-12-22 | Chris Sotraidis | Initial component specifications |
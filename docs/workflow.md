# WORKFLOW.md — User Workflow

Owner: Chris Sotraidis
Created time: December 22, 2025 5:33 PM

**Version:** 0.1.0

**Status:** Draft

**Last Updated:** 2025-12-22

---

## 1. The Core Loop

Mini Artifact follows a **Write → Plan → Build → Review** workflow:

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  WRITE  │ ───▶ │  PLAN   │ ───▶ │  BUILD  │ ───▶ │ REVIEW  │
│ Describe│     │ Spec    │     │ Generate│     │ Preview │
│ intent  │     │ builds  │     │ code    │     │ & refine│
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                              │ Iterate
                                              ▼
                                         Back to WRITE
```

| Phase | User Action | System Response | Output |
| --- | --- | --- | --- |
| **Write** | Describe app in natural language | Ask clarifying questions | Conversation |
| **Plan** | Answer questions, review spec | Build structured spec | JSON Spec |
| **Build** | Click "Generate" | Assemble patterns + deltas | HTML/CSS/JS |
| **Review** | Interact with preview | Update spec, rebuild | Refined app |

---

## 2. User Interface Layout

```
┌────────────────────────────────────────────────────────────────┐
│  📦 Mini Artifact                          [Export] [Reset] │
├────────────────────┬────────────────────┬─────────────────────┤
│   CHAT PANEL       │   SPEC PANEL       │   PREVIEW PANEL       │
│                    │                    │                       │
│  User: I want a    │  {                 │  ┌─────────────────┐  │
│  todo list app     │    "meta": {       │  │ My Todo App     │  │
│                    │      "name":       │  ├─────────────────┤  │
│  System: What      │      "Todo",       │  │ ☐ Buy groceries │  │
│  properties?       │    },              │  │ ☑ Walk dog      │  │
│                    │    "entities": []  │  │ [+ Add Todo]    │  │
│  User: Title,      │  }                 │  └─────────────────┘  │
│  completed, due    │                    │                       │
├────────────────────┴────────────────────┴─────────────────────┤
│ [Type your message...]                       [🚀 Generate] │
└────────────────────────────────────────────────────────────────┘
```

| Panel | Purpose | Updates When |
| --- | --- | --- |
| **Chat** | Conversation with Mini-Arnold | User sends message |
| **Spec** | Live JSON specification | Spec updates |
| **Preview** | Rendered app | Build completes |

---

## 3. Example Conversation

```markdown
**User:** I want a simple task manager

**System:** Great! What properties should tasks have?
For example: title, description, status, priority, due date.

**User:** Title, status (todo/in progress/done), and priority

**System:** Got it. I'll add:
- Title (text)
- Status (select: todo, in progress, done)  
- Priority (select: low, medium, high)

Should tasks have due dates?

**User:** Yes, add due dates

**System:** Your spec is ready:
• **Task** entity with: title, status, priority, due date
• **List view** showing all tasks
• **Actions:** Create, update, delete

Click **Generate** when ready!

**User:** [Clicks Generate]

**System:** Building... 
✓ Assembling patterns (4/4)
✓ Generating custom logic
✓ Rendering preview

Done! Your task manager is in the preview panel.

**User:** Can completed tasks appear gray?

**System:** Sure! I'll add styling for completed tasks.
[Updates spec]
Click **Regenerate** to see the change.
```

---

## 4. Workflow Steps

### Step 1: Initial Description

**User:** "I want to build a todo list app"

**System:**

1. Routes to Mini-Arnold
2. Parses intent, identifies gaps
3. Asks clarifying question

### Step 2: Clarifying Questions

**System:** "What properties should todos have?"

**User:** "Title, completed checkbox, due date"

**System:**

1. Adds properties to spec
2. Checks for more gaps
3. Continues until complete

### Step 3: Spec Completion

**System signals ready:**

- Generate button activates
- Spec Panel shows complete JSON
- Status: "Ready to build"

### Step 4: Build

**User clicks Generate:**

1. Mini-Nedry validates spec
2. Matches patterns to requirements
3. Mini-Raptor assembles code
4. Preview renders result

### Step 5: Iteration

**User:** "Add a priority field"

1. Mini-Arnold updates spec
2. User clicks Regenerate
3. New version appears

---

## 5. Error Handling

| Error Type | User Sees | System Action |
| --- | --- | --- |
| Incomplete spec | "Spec incomplete. Missing: [list]" | Asks clarifying questions |
| Build failure | "Issue building [component]" | Suggests fix or alternative |
| API error | "Service unavailable" | Shows retry button |

---

## 6. Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Enter` | Send message |
| `Cmd+Enter` | Generate |
| `Cmd+E` | Export code |
| `Cmd+R` | Reset |

---

## 7. Export Options

| Option | Format |
| --- | --- |
| Download HTML | Single `.html` file |
| Download ZIP | Separate html/css/js |
| Copy Spec | JSON to clipboard |
| Copy Code | HTML to clipboard |

---

## 8. State Persistence

**Saved (Session Storage):**

- Conversation history
- Current specification
- Last build result

**Not Saved:**

- No server-side storage
- Data cleared on browser close

---

## Changelog

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1.0 | 2025-12-22 | Chris Sotraidis | Initial workflow |
---
name: agent-tracker
description: Operate the agent-tracker Git-backed execution harness and Kanban state machine via CLI — inspect task frontier (`next`), claim atomic tickets (`in_progress`), record verifiable terminal execution evidence (`in_review`), synchronize with Git commits (1 ticket = 1 commit), and observe progress via real-time Next.js board. Use whenever selecting next tasks, updating ticket status, decomposing complex user stories, or registering execution evidence.
---

# Agent Tracker — Engineering Harness & Execution Skill

`agent-tracker` is a local-first, Git-backed task harness designed to keep AI coding agents disciplined, grounded, and verifiable. It eliminates drift, prevents premature task completion, and enforces atomic commits.

---

## 🎯 Core Operating Principles

1. **Single Source of Truth:** `kanban.db` (SQLite) is tracked directly in Git alongside your codebase. No external cloud SaaS or API keys required.
2. **Single-Writer Pattern:** All database mutations pass strictly through the pre-compiled Clean Architecture CLI (`cli.mjs`). Never modify SQLite tables using ad-hoc SQL or scripts.
3. **Topological Frontier:** Agents work sequentially. A ticket can only be claimed if all preceding sibling tickets in the same story are marked `done`.
4. **No Proof, No Progress:** Status transitions to `in_review` and `done` **strictly require** concrete terminal execution evidence (command invocation + captured outputs).
5. **Atomic Commits (1 Ticket = 1 Commit):** Each ticket corresponds to exactly one isolated, functional, and fully verified Git commit.

---

## ⚡ The Agent Discipline Loop

Follow this sequence for every ticket:

```mermaid
graph TD
    A[1. Check Frontier: `next`] --> B[2. Claim Ticket: `status in_progress`]
    B --> C[3. Dynamic Adaptation & Decomposition]
    C --> D[4. Implementation & Local Development]
    D --> E[5. Verifiable Execution: Real Tests / E2E]
    E --> F[6. Submit Review: `status in_review --evidence '...'`]
    F --> G[7. Atomic Git Commit: `type(id): message`]
    G --> H[8. Mark Completed: `status done`]
```

### Step 1: Query Frontier
Retrieve the next unblocked tickets ready for execution:
```bash
node cli.mjs next 3
# Or with structured JSON output:
node cli.mjs next --json
```

### Step 2: Claim Task
Set status to `in_progress` before writing any code:
```bash
node cli.mjs status <ticket-id> in_progress
```

### Step 3: Dynamic Ticket Adaptation & Atomicity
- **Do not blindly follow generic templates.** If investigating the codebase reveals unexpected complexity (e.g., separate database migration needed before entity definition, or middleware configuration required before controller routes), refine or split tickets:
  - Add specific sub-tasks: `node cli.mjs ticket add <backlog-id> --name "..."`
  - Rename for clarity: `node cli.mjs ticket update <id> --name "feat(<id>): ..."`
- The more specific the ticket scope, the cleaner and more reviewable the commit.

### Step 4: Implementation & Verification
Write the feature or fix. Then, execute real verification commands:
- Unit / integration test suite runs (`pnpm test ...`).
- Migration up and down tests (`pnpm run migration:run && pnpm run migration:undo`).
- Real HTTP cURL queries against the running server.
- Linter and typechecker checks (`pnpm run typecheck && pnpm run lint`).

### Step 5: Submit for Review with Real Evidence
Transition to `in_review` with verifiable proof:
```bash
node cli.mjs status <ticket-id> in_review --evidence "pnpm test src/auth/auth.service.spec.ts (PASS: 5 suites, 18 tests passed in 1.4s)"
```

### Step 6: Atomic Git Commit
Commit the code changes along with `kanban.db` (and re-rendered `index.html` if applicable):
```bash
git add .
git commit -m "<type>(<ticket-id>): <concise functional summary>"
```
*Commit types:* `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

### Step 7: Finalize
Once reviewed and committed, mark the ticket `done`:
```bash
node cli.mjs status <ticket-id> done
```

---

## 📋 Complete CLI Command Reference

All commands support `--json` anywhere in the arguments for programmatic ingestion by agents.

### 1. Inspection & Context
```bash
node cli.mjs next [n]                            # List top N frontier tickets ready for work
node cli.mjs show <backlogId|ticketId> [--json]  # Full context: AC, DoD, Notes, BRD, siblings
node cli.mjs stats                               # Summary of statuses, story points, and counts
node cli.mjs render                              # Re-render static index.html snapshot
```

### 2. State Machine Transitions
```bash
node cli.mjs status <ticket-id> in_progress
node cli.mjs status <ticket-id> in_review --evidence "<exact terminal command + output>"
node cli.mjs status <ticket-id> done [--evidence "<optional final notes>"]
```
*Allowed transitions:* `todo → in_progress → in_review → done` (no skipping states).

### 3. Backlog Management (`task` table)
```bash
node cli.mjs backlog list [--json]
node cli.mjs backlog show <id> [--json]
node cli.mjs backlog add --brd <brd-id> --name "<title>" [options]
node cli.mjs backlog update <id> [options]
node cli.mjs backlog delete <id> --yes            # Cascade deletes associated tickets
```

**Options for `backlog add` & `backlog update`:**
| Flag | Type | Description |
|---|---|---|
| `--brd <id>` | string | Parent business requirement ID (required for `add`) |
| `--name <text>` | string | Backlog item title (`task_name`, required for `add`) |
| `--usecase <text>` | string | Domain use case category |
| `--module <text>` | string | Subsystem or module name |
| `--sp <number>` | integer | Estimated story points (e.g. `3`, `5`, `8`) |
| `--figma <url>` | string | Design URL (including specific `node-id`) |
| `--ac <text>` | string | Inline short Acceptance Criteria |
| `--ac-file <path>` | filepath | Acceptance Criteria from Markdown file (relative to CWD) |
| `--dod <text>` | string | Inline short Definition of Done |
| `--dod-file <path>` | filepath | Definition of Done from Markdown file |
| `--notes <text>` | string | Inline short architectural notes |
| `--notes-file <path>` | filepath | Architectural notes from Markdown file |
| `--id <id>` | string | Custom backlog ID (defaults to auto-incremented `TASK-001`) |

### 4. Ticket Management (`ticket` table)
```bash
node cli.mjs ticket list <backlog-id> [--json]
node cli.mjs ticket show <id> [--json]
node cli.mjs ticket add <backlog-id> --name "<name>" [options]
node cli.mjs ticket update <id> [options]
node cli.mjs ticket delete <id> --yes
node cli.mjs ticket status <id> <status> [--evidence "<proof>"]
```

**Options for `ticket add` & `ticket update`:**
| Flag | Type | Description |
|---|---|---|
| `--name <text>` | string | Ticket title / summary (required for `add`) |
| `--desc <text>` | string | Specific micro-scope, deliverables, and test scenarios inline |
| `--desc-file <path>` | filepath | Specific ticket deliverables from Markdown file |
| `--assignee <text>` | string | Assignee name (default: `TBD`) |
| `--sprint <text>` | string | Sprint name (default: `Backlog`) |
| `--seq <number>` | integer | Sequential order within backlog |
| `--evidence <text>` | string | *(update only)* Terminal verification proof |

### 5. Business Requirement Management (`brd` table)
```bash
node cli.mjs brd list [--json]
node cli.mjs brd add --title "<title>" --description "<description>" [--id BR-001]
```

---

## 📐 Document Ingestion & High-Fidelity Detailing Standard

When an agent is tasked with ingesting an architecture document (SAD), product requirements (PRD), or user stories:

### 1. Modular Subsystem Decomposition
- **Forbidden:** Cramming a comprehensive multi-chapter document into a single generic backlog.
- **Required:** Decompose the system into distinct, modular backlogs representing cohesive domain boundaries or subsystems (e.g. `ROUTING`, `STREAMING-PROXY`, `ADMIN-API`, `DASHBOARD-UI`).
- Attach each backlog to its parent Business Requirement (`brd`).

### 2. Mandatory Backlog Quality Standards (Never Inline 1-Paragraph Summaries)
Do not use short inline `--ac "..."` for complex features. Always draft structured Markdown files in `.tmp/` and attach them via CLI:

- **Acceptance Criteria (`--ac-file <path>`):**
  - Section 1: API contracts, query parameters, route definitions, headers.
  - Section 2: Concrete functional checklist per component with exact numbers & values from the spec.
  - Section 3: Gherkin behavioral test scenarios (`Given [state] When [action] Then [outcome]`).
  - Section 4: Non-functional requirements (latensi SLA, memory limits, caching policy).
- **Definition of Done (`--dod-file <path>`):**
  - Static analysis quality gates (`0 errors`, strict lint, formatting).
  - Test coverage thresholds (e.g. $\ge 80\%$ statements/branches/lines).
  - Database schema reversibility (up & down migrations tested).
  - Security, authorization guards, and error fallback rules.
- **Architectural Notes (`--notes-file <path>`):**
  - Mermaid architecture & sequence diagrams (will render natively in the Next.js board!).
  - Exact JSON request / response payloads with real field names.
  - Database schema definitions (DDL, primary keys, indexes).

### 3. Ticket-Level Scope & Micro-Deliverables
Each atomic ticket must declare its specific scope using `--desc-file`:
```bash
node cli.mjs ticket update <ticket-id> --desc-file .tmp/<ticket-spec>.md
```
Specify:
- Exact files/modules to create or modify.
- Concrete classes, functions, or database migrations to implement.
- Specific unit or integration test cases to run for evidence.

---

## 🚫 Hallucination Guardrails & Anti-Patterns

1. **Never claim completion without execution:** Stating "the code should now work" or "syntax looks correct" without executing the relevant test or command will fail review.
2. **Never skip states:** Direct jumps from `todo` to `done` or `in_progress` to `done` are rejected by the state machine.
3. **Never work on non-frontier tickets:** Picking tickets when prior sequential tickets are still `todo` breaks dependency ordering.
4. **Never bundle multiple tickets into one commit:** Keep diffs atomic, self-contained, and isolated to the claimed ticket.
5. **Never accept vague single-sentence backlogs:** Always detail acceptance criteria, DoD, and notes before claiming implementation tickets.

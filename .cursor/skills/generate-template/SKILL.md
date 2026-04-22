---
name: generate-template
description: "Interactively generate a complete ProjectTemplate (User Stories, Epics, Sprints) from a reference project folder and persist it to the database. Use when an admin wants to create a new template from an existing codebase or documentation folder."
---

# Generate Template

Turn a reference project folder into a complete, database-ready `ProjectTemplate` — including INVEST-aligned User Stories, Epics, and Sprints — through a fully guided, human-in-the-loop session.

The session is crash-safe: every approved item is written to `scripts/template-wip.json` immediately, so you can resume a partial session any time.

---

## Phase 1 — Explore the Reference Project

### Step 1 · Get the folder path

Ask the admin:

> "What is the **absolute path** to the reference project folder?"

If the admin provides a relative path, resolve it from the current working directory.

### Step 2 · Explore the folder

Use `Read` and `Glob` to understand the project. Prioritise:
- `README.md`, `ARCHITECTURE.md`, `docs/`, `ADR/`, any `*.md` files
- Entry points: `main.*`, `index.*`, `app.*`, `server.*`
- Feature folders: `src/`, `lib/`, `modules/`, `features/`, `components/`
- Config files that reveal the tech stack: `package.json`, `pyproject.toml`, `build.gradle`, `Cargo.toml`, `go.mod`
- Database schema files: `schema.prisma`, `models.py`, `*.sql`, migration folders

**Skip entirely** (do not read):
- `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`, `out/`, `coverage/`
- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`, `Pipfile.lock`
- Binary files, images, fonts

If the folder contains **only documentation** (no source code), that is fine — extract the project understanding from the docs alone.

---

## Phase 2 — Propose Metadata & Wait for Confirmation

Based on your exploration, propose all required template metadata fields. Present them clearly:

```
Proposed Template Metadata
──────────────────────────
Title        : <title>
Description  : <2–3 sentence description>
Category     : <e.g., Web Development / Mobile / DevOps>
Difficulty   : BEGINNER | INTERMEDIATE | ADVANCED
Methodology  : SCRUM | KANBAN
Access Type  : FREE | CREDITS | MENTORSHIP
Technologies : <comma-separated list, or "none">
Min / Max Participants : <n> / <n>
```

Then ask:

> "Does this metadata look right? Reply **yes** to confirm, or tell me what to change."

Wait for confirmation. Apply any changes. Do **not** proceed until the admin explicitly confirms the metadata.

### Initialize template-wip.json

Once metadata is confirmed, create (or overwrite) `scripts/template-wip.json` in the Code-Wiser project root with the following structure:

```json
{
  "metadata": {
    "title": "<confirmed title>",
    "description": "<confirmed description>",
    "categoryName": "<confirmed category>",
    "difficulty": "<BEGINNER|INTERMEDIATE|ADVANCED>",
    "methodology": "<SCRUM|KANBAN>",
    "accessType": "<FREE|CREDITS|MENTORSHIP>",
    "technologies": [],
    "minParticipants": 1,
    "maxParticipants": 4
  },
  "userStories": [],
  "epics": [],
  "sprints": []
}
```

---

## Phase 3 — User Story Generation Loop

Generate User Stories **one at a time**. For each story, follow these rules:

### User Story Format

Every story MUST include all of the following fields:

| Field | Requirement |
|---|---|
| **Title** | Short verb phrase, ≤ 6 words. Captures the action without naming an actor (e.g. "Scaffold the Project", "Authenticate Users", "Display Blog Post"). **Never** use the "As a…" sentence format here. |
| **Description** | First line MUST be the full user story sentence: "As a `<actor>`, I want `<feature>`, so that `<benefit>`." — followed by a full INVEST-aligned narrative (Independent, Negotiable, Valuable, Estimable, Small, Testable). Min 3 additional sentences after the opening line. |
| **Acceptance Criteria** | Numbered list of ≥ 3 concrete, testable conditions. Each starts with "Given / When / Then" or a clear pass/fail statement. |
| **Type** | One of: `USER_STORY`, `TASK`, `SUBTASK`, `BUG` (default: `USER_STORY`) |
| **Priority** | One of: `LOWEST`, `LOW`, `MEDIUM`, `HIGH`, `HIGHEST` |
| **Tags** | At least one tag (e.g., `frontend`, `backend`, `auth`, `database`, `api`, `ui`) |

**Worked example — correct format:**

| Field | Example value |
|---|---|
| **Title** | `Scaffold the Project` |
| **Description** | `As a developer, I want to scaffold the project with Next.js 15 and TypeScript, so that I have a type-safe foundation ready for development.` _(followed by INVEST narrative)_ |
| **Acceptance Criteria** | `1. Running bun install && bun run dev starts the server on port 3000 without errors.` … |

Present the story clearly, then ask:

> "**[Story #N]** — approve (**a**), edit (**e**), reject (**r**), or regenerate with feedback (**f: your note**)?"

### Admin responses

| Input | Action |
|---|---|
| `a` or `approve` | Write the story to `template-wip.json`, increment counter, generate the next story |
| `e` or `edit` | Admin provides corrections inline; apply them, show the updated story, ask again |
| `r` or `reject` | Discard the story silently, generate the next story |
| `f: <note>` | Regenerate the story using the feedback as a constraint, show the new version, ask again |
| `done` or `stop` | Exit the loop |

After each approval, display:

> "✓ Story approved. **Approved so far: N**. Generating the next story..."

### Loop rules

- Generate stories in logical order: core domain entities first, then features, then cross-cutting concerns (auth, notifications, etc.)
- Never generate two stories with the same `title`
- **A title that matches the "As a `<actor>`, I want…" pattern is invalid.** If you catch yourself writing such a title, regenerate it as a verb phrase before presenting the story to the admin.
- Stop generating new stories when the admin signals `done` / `stop`, or when you judge all meaningful slices of the project have been covered (and ask for confirmation before stopping)
- The loop is resumable: if `template-wip.json` already contains stories, announce how many are already approved and continue from where the session left off

---

## Phase 4 — Epic Grouping

After the User Story loop ends, analyze all approved stories and propose **Epic groupings**.

For each Epic, present:

```
Epic: <Epic Title>
Description: <1–2 sentences about this domain>
User Stories:
  - <US title 1>
  - <US title 2>
  ...
```

Then ask:

> "Do these Epics look right? You can:
> - **approve** to confirm all
> - **rename `<old>` → `<new>`** to rename an Epic
> - **merge `<A>` + `<B>` → `<new name>`** to combine two Epics
> - **split `<epic>` → `<name1>` / `<name2>`** to divide an Epic
> - **move `<US title>` → `<epic>`** to reassign a story to a different Epic
> - Type **done** when all Epics are confirmed"

Apply each edit one at a time, show the updated Epic list after every change, and ask again until the admin types `done`.

Once confirmed, write the `epics` array to `template-wip.json`. Each story's `epicTitle` field must also be updated to match the confirmed Epic title.

---

## Phase 5 — Sprint Planning

Analyze the confirmed Epics and User Stories. Propose a **Sprint plan** that groups stories by dependency and complexity.

For each Sprint, present:

```
Sprint N: <Narrative Title>
Description: <What the team will accomplish this sprint>
User Stories:
  - <US title> [priority]
  ...
```

Then ask:

> "Does this sprint plan look right? You can:
> - **approve** to confirm all
> - **rename sprint `<N>` → `<new title>`** to rename a sprint
> - **move `<US title>` → sprint `<N>`** to reassign a story
> - Type **done** when the sprint plan is confirmed"

Apply each edit, show the updated plan, and ask again until the admin types `done`.

Sprint ordering rules:
- Sprint 1 should contain foundational stories (project setup, auth, data models)
- Later sprints build on earlier ones
- No sprint should be unreasonably large (aim for 4–8 stories per sprint)

Once confirmed, write the `sprints` array to `template-wip.json`. Each story's `sprintTitle` field must also be updated to match the confirmed Sprint title.

---

## Phase 6 — Final Summary & Confirmation

Display the complete structure before writing to the database:

```
═══════════════════════════════════════════════
  TEMPLATE SUMMARY
═══════════════════════════════════════════════
Title       : <title>
Category    : <category>
Difficulty  : <difficulty>
Methodology : <methodology>
Access Type : <accessType>
Technologies: <list>

EPICS (<n> total)
─────────────────
  Epic 1: <title>
    • <US title>
    • <US title>
  ...

SPRINTS (<n> total)
───────────────────
  Sprint 1: <title> (<k> stories)
    • <US title>
    • <US title>
  ...

Total User Stories: <N>
═══════════════════════════════════════════════
```

Then ask:

> "Everything looks good? Type **yes** to persist to the database, or describe any final changes."

If the admin requests changes, apply them and show the updated summary. Repeat until they confirm.

---

## Phase 7 — Persist to Database

Once the admin confirms, run the persistence script:

```bash
npx tsx scripts/create-template-from-skill.ts
```

- If the script exits **successfully**, announce:
  > "✅ Template created! ID: `<id>`
  > You can find and review it in the admin panel."

- If the script exits with an **error**:
  - Surface the full error message
  - If the error is "template title already exists": suggest renaming the title in `template-wip.json` and rerunning
  - If the error is a DB connection error: confirm the `DATABASE_URL` env var is set and the database is reachable
  - Offer to re-run the script after the admin fixes the issue

---

## Resume Instructions

If `scripts/template-wip.json` already exists at the start of the session, read it and determine what has already been completed:

- If `metadata` is populated but `userStories` is empty → resume from Phase 3
- If `userStories` has entries but `epics` is empty → resume from Phase 4
- If `epics` has entries but `sprints` is empty → resume from Phase 5
- If `sprints` has entries → offer to show the final summary (Phase 6) and proceed to Phase 7

Always announce the resume state to the admin:

> "Found an existing session with N approved user stories, M epics, and K sprints. Resuming from Phase <X>..."

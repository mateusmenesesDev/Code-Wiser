# Plan: AI Template Creator Skill

> Source PRD: `plans/prd-ai-template-creator-skill.md`

## Architectural decisions

- **No schema changes** — `ProjectTemplate`, `Task`, `Epic`, `Sprint`, and `Category` models already cover all required fields. No Prisma migrations needed.
- **Two deliverables**: a `SKILL.md` agent skill file (lives outside the app bundle) and a `scripts/create-template-from-skill.ts` Prisma persistence script.
- **WIP state contract**: both the skill and the script communicate through a `scripts/template-wip.json` file with a single agreed JSON shape (see Phase 1).
- **Skill location**: `.cursor/skills/generate-template/SKILL.md` — project-local, shared with anyone using the repository.
- **Template status**: always inserted as `PENDING`; no approval bypass.
- **Category / Technology lookup**: resolved by name; created with `approved: false` if missing.
- **Atomicity**: the entire DB write happens inside a single `prisma.$transaction`.
- **Idempotency**: if a `ProjectTemplate` with the same title already exists, the script aborts with a clear error message and exits non-zero.

---

## Phase 1: Persistence Script & JSON Contract

**User stories**: 26, 27, 28

### What to build

Define the `template-wip.json` schema and build the `scripts/create-template-from-skill.ts` script that reads it and writes a complete `ProjectTemplate` tree to the database. This phase is fully testable with a hand-crafted JSON file, before the skill exists.

The JSON contract captures:
- Template metadata: title, description, category name, difficulty, methodology, access type, optional technologies list
- An array of User Stories, each with: title, description, acceptance criteria, type, priority, tags, epic title reference, sprint title reference
- An array of Epics: title, description
- An array of Sprints: title, description, order

The script supports a `--dry-run` flag that prints the full structure that would be inserted (formatted JSON) without touching the database.

On success the script prints the new `ProjectTemplate.id` to stdout.

### Acceptance criteria

- [ ] `scripts/template-wip.json` schema is documented (TypeScript interface or inline JSDoc)
- [ ] Running the script with a valid JSON file creates a `ProjectTemplate` (status `PENDING`), all Epics, all Sprints, and all Tasks in a single transaction
- [ ] Task→Epic and Task→Sprint relations are resolved by title match
- [ ] Running the script a second time with the same template title exits with a descriptive error and leaves the DB unchanged
- [ ] `--dry-run` flag prints the full payload and exits 0 without writing anything
- [ ] Missing Category or Technology records are created with `approved: false`
- [ ] Script exits non-zero and prints a useful message on any DB error

---

## Phase 2: Skill — Exploration, Metadata & User Story Loop

**User stories**: 1–17, 29, 30

### What to build

Create the `SKILL.md` file covering the first half of the interactive flow: folder ingestion, project understanding, metadata proposal, and the User Story generation loop.

When invoked, the skill instructs the agent to:
1. Ask the admin for an absolute path to the reference project folder
2. Explore the folder (source code + docs) using Read/Glob tools to build understanding; skip `node_modules`, build artifacts, and lock files
3. Propose template metadata (title, description, category, difficulty, methodology, access type) and wait for confirmation/edits
4. Initialize `scripts/template-wip.json` with confirmed metadata
5. Enter a loop: generate one User Story at a time (INVEST title + full description + acceptance criteria + type + priority + tags), display a running count, and wait for the admin to approve / edit / reject / regenerate with feedback
6. Write each approved US to `template-wip.json` immediately (so the session survives interruption)
7. Exit the loop when the admin signals no more stories are needed

At the end of this phase, running Phase 1's script against the produced `template-wip.json` already yields a valid (stories-only) template in the DB — the slice is end-to-end demonstrable.

### Acceptance criteria

- [ ] Skill file exists at `.cursor/skills/generate-template/SKILL.md`
- [ ] Skill instructs the agent to skip non-essential files (node_modules, .git, dist, lock files) during exploration
- [ ] Agent proposes all required metadata fields; admin can override any field before generation begins
- [ ] Each generated US includes: INVEST-format title, full description, numbered acceptance criteria, type, priority, and at least one tag
- [ ] Admin can approve, edit inline, reject, or request regeneration with feedback for any US
- [ ] Running count of approved USs is shown after each approval
- [ ] `template-wip.json` is updated after every approval — session is resumable
- [ ] Skill handles reference folders that contain only documentation (no source code) without errors
- [ ] At loop end, `template-wip.json` contains valid JSON that Phase 1's script can consume

---

## Phase 3: Skill — Epic & Sprint Planning, Final Summary & Persistence

**User stories**: 18–25, and closes 26–28 end-to-end

### What to build

Extend the skill with the second half of the flow: Epic grouping, Sprint planning, a final confirmation summary, and invocation of the persistence script.

After the User Story loop completes, the skill instructs the agent to:
1. Analyze all approved USs and propose Epic groupings (name + description + list of assigned US titles); wait for the admin to approve, rename, merge, split, or reassign individual USs to different Epics
2. Write confirmed Epics to `template-wip.json`
3. Propose a Sprint plan (numbered sprints with title, description, and assigned USs based on dependency and complexity); wait for the admin to approve, reorder, or reassign USs across sprints
4. Write confirmed Sprints to `template-wip.json`
5. Display a final structured summary (metadata → Epics → Sprints → US count per sprint) and ask for one last confirmation
6. On confirmation, run `npx tsx scripts/create-template-from-skill.ts` and surface the returned template ID (or any error) to the admin

### Acceptance criteria

- [ ] Agent proposes at least one Epic per logical domain; each Epic lists its assigned US titles
- [ ] Admin can rename, merge two Epics into one, split one Epic into two, or reassign a US to a different Epic
- [ ] Agent proposes a sprint plan with a meaningful narrative title and description per sprint
- [ ] Admin can move any US between sprints or rename a sprint before confirming
- [ ] Final summary displays metadata, all Epics with their USs, and all Sprints with their USs in a readable format
- [ ] The persistence script is invoked automatically after the admin's final confirmation
- [ ] The new `ProjectTemplate.id` is shown to the admin on success
- [ ] Any script error is surfaced clearly with actionable guidance (e.g., "template title already exists — rename and retry")
- [ ] Full end-to-end run (folder path → confirmed metadata → approved USs → confirmed Epics → confirmed Sprints → DB write) completes without manual steps outside the skill

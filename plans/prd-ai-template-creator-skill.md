## Problem Statement

Creating project templates for the Code-Wiser platform today is a manual, time-consuming process. An admin must manually write every User Story, define Epics, plan Sprints, and enter everything through the UI wizard or a JSON import file. This process is error-prone, inconsistent, and does not scale — especially given that the platform already has well-defined quality standards (INVEST principles, acceptance criteria) that must be followed for every task. When a reference project already exists as code (e.g., a doctor-scheduling app), there is no automated way to transform that codebase into a structured, well-documented project template.

## Solution

Create a Cursor/Claude agent skill (`generate-template`) that an admin or mentor runs from the IDE or Claude CLI. The skill receives the absolute path to a reference project folder (containing source code and/or documentation), reads and understands the project, and then interactively guides the admin through generating a complete `ProjectTemplate` — including User Stories (following INVEST), Epics, and Sprints. At each step the agent proposes content and waits for the human to approve, edit, or reject. Once the full structure is confirmed, a dedicated Prisma script persists everything to the database as a new `ProjectTemplate` with status `PENDING`, ready for admin review and approval.

## User Stories

1. As an admin, I want to point the skill at a local project folder so that I don't have to manually describe the project from scratch.
2. As an admin, I want the agent to read both source code and documentation files from the reference folder so that it has the fullest possible understanding of the system.
3. As an admin, I want the agent to suggest a `ProjectTemplate` title and short description so that I have a quality starting point I can refine.
4. As an admin, I want to confirm or edit the suggested template title and description before generation begins so that the context for subsequent steps is correct.
5. As an admin, I want the agent to suggest the category, difficulty level (`BEGINNER` / `INTERMEDIATE` / `ADVANCED`), methodology (`SCRUM` / `KANBAN`), and access type for the template so that I don't have to fill in every metadata field manually.
6. As an admin, I want to confirm or override the suggested metadata fields so that I have full control over the template configuration.
7. As an admin, I want the agent to generate User Stories one by one so that I can review each carefully without being overwhelmed.
8. As an admin, I want each generated User Story to include a title in "As a \<actor\>, I want \<feature\>, so that \<benefit\>" format so that stories are consistent and user-centric.
9. As an admin, I want each User Story to include a full INVEST-aligned description so that developers have enough context to understand the goal.
10. As an admin, I want each User Story to include clearly-defined acceptance criteria (as a numbered or bulleted list) so that developers and testers know exactly when a story is done.
11. As an admin, I want each User Story to have an assigned type (`USER_STORY`, `TASK`, `SUBTASK`, or `BUG`) so that the backlog is properly categorized.
12. As an admin, I want each User Story to have a suggested priority (`LOWEST`, `LOW`, `MEDIUM`, `HIGH`, `HIGHEST`) so that sprints can be planned by importance.
13. As an admin, I want each User Story to have suggested tags (e.g., `frontend`, `backend`, `auth`, `payments`) so that items can be filtered in the workspace.
14. As an admin, I want to approve, edit, or reject each User Story before moving to the next so that no low-quality story enters the template.
15. As an admin, I want to request a regeneration of a specific User Story with feedback so that I can guide the agent to improve it.
16. As an admin, I want a running count of approved User Stories displayed during generation so that I know where I am in the process.
17. As an admin, I want to be able to pause and resume the skill without losing already-approved User Stories so that long sessions are not lost to timeouts or interruptions.
18. As an admin, I want the agent to analyze all approved User Stories and suggest Epics to group them by domain/feature so that the template has a meaningful high-level structure.
19. As an admin, I want to see the proposed Epic name, description, and list of assigned User Stories for each Epic so that I can verify the grouping makes sense.
20. As an admin, I want to approve, rename, merge, or split suggested Epics so that the Epic structure reflects the real architecture of the project.
21. As an admin, I want to reassign individual User Stories to different Epics during the review step so that any misclassified stories are corrected.
22. As an admin, I want the agent to suggest a sprint plan that groups User Stories across numbered sprints (e.g., Sprint 1, Sprint 2, Sprint 3) based on dependency and complexity so that the template has a sensible delivery roadmap.
23. As an admin, I want each Sprint to have a suggested title and description so that the template gives mentees a narrative for what they'll build in each sprint.
24. As an admin, I want to approve, edit, reorder, or reassign User Stories across sprints so that the sprint plan reflects realistic delivery expectations.
25. As an admin, I want to confirm the complete structure (template metadata + USs + Epics + Sprints) with a final summary view before it is written to the database so that there are no surprises.
26. As an admin, I want the final data to be persisted to the database via a Prisma script so that I don't need to manually run any SQL or use the UI.
27. As an admin, I want the created `ProjectTemplate` to be saved with status `PENDING` so that it goes through the normal approval workflow before becoming visible to users.
28. As an admin, I want to receive a confirmation with the new template's database ID after the script runs so that I can find and review it in the admin panel.
29. As an admin, I want the skill to support reference projects of any language or framework so that the platform can grow its template library independently of the tech stack of the sample code.
30. As an admin, I want the skill to gracefully handle reference folders that contain only documentation (no source code) so that even spec-only projects can be used as templates.

## Implementation Decisions

### Skill Architecture
- The feature is implemented as a **Cursor/Claude agent skill** (`SKILL.md`) located at a path like `/home/mateus/.claude/skills/generate-template/SKILL.md`.
- The skill is invoked by the user providing an **absolute path** to the reference project folder at the start of the interaction.
- The agent itself acts as the AI — no tRPC or external LLM API calls are made from within the skill. All generation and reasoning happens in the agent's context window.
- The skill is write-protected and not part of the Next.js application bundle.

### Skill Execution Flow
1. **Input**: Admin provides an absolute path to the reference project folder.
2. **Exploration**: Agent reads source files and documentation from the folder (using Read/Glob tools) to build understanding.
3. **Metadata proposal**: Agent proposes template title, description, category, difficulty, methodology, access type. Admin confirms or edits.
4. **User Story generation loop**: Agent generates one US at a time, waits for approval/edit/rejection before continuing.
5. **Epic suggestion**: After all USs are approved, agent groups them into Epics and presents each for review.
6. **Sprint suggestion**: After Epics are confirmed, agent assigns USs to numbered Sprints and presents the plan for review.
7. **Final summary**: Agent displays the complete structure for one last confirmation.
8. **Persist**: Agent invokes a dedicated Node/TypeScript script (using Prisma client directly) that writes the full template to the DB.

### Persistence Script
- A new script at `scripts/create-template-from-skill.ts` accepts a structured JSON payload (template metadata + USs + Epics + Sprints) and uses the Prisma client to insert all records atomically (using `prisma.$transaction`).
- The script maps Epics and Sprints by title to resolve foreign keys before inserting Tasks.
- The `ProjectTemplate` is created with `status: PENDING`.
- Existing Category and Technology records are looked up by name; missing ones are created with `approved: false`.
- The script outputs the new template's `id` to stdout on success.
- The script is idempotent on title uniqueness — if a template with the same title already exists, it aborts with a descriptive error.

### Data Mapping
- Each approved User Story maps to a `Task` record with `projectTemplateId` set, `projectId` null.
- Each Epic maps to an `Epic` record with `projectTemplateId` set, `status: PLANNED`.
- Each Sprint maps to a `Sprint` record with `projectTemplateId` set, `status: PLANNING`, `order` matching sprint number.
- Task→Epic and Task→Sprint relations are resolved by title during script execution.

### User Story Content Standard
- Title must follow: "As a \<actor\>, I want \<feature\>, so that \<benefit\>."
- Description must follow the INVEST mnemonic: Independent, Negotiable, Valuable, Estimable, Small, Testable.
- Acceptance criteria must be a numbered list of concrete, testable conditions.
- Each US ships with a `type` (defaulting to `USER_STORY`), a `priority`, and at least one `tag`.
- Story points are **out of scope** for the initial version (can be added via Planning Poker after template instantiation).

### Intermediate State Persistence
- During the interactive session, the agent saves approved items incrementally to a local JSON file (e.g., `scripts/template-wip.json`) so that the session can be resumed if interrupted.
- The persistence script reads from this JSON file when invoked.

## Out of Scope

- UI/admin panel integration for running the skill (this is a developer/admin CLI tool only).
- Automatic approval of the generated `ProjectTemplate` (it always starts as `PENDING`).
- Multi-language content generation (PT-BR / EN localization — covered by a separate feature).
- Story-points estimation during generation (to be handled via Planning Poker post-creation).
- Learning outcomes, milestones, and project images — these can be added manually after the template is created.
- Automated testing of generated content (no test assertions are run on the LLM output).
- Fetching reference projects from remote URLs or GitHub repositories (only local paths are supported).
- Versioning or update of an existing `ProjectTemplate` (only net-new template creation is in scope).

## Further Notes

- The skill relies on the agent's context window to hold the full reference project. Very large codebases may need to be trimmed by the admin before running (e.g., excluding `node_modules`, build artifacts, lock files). The skill instructions should include guidance on what to exclude.
- The `Category` model requires `approved: true` for the template to be fully functional. Newly created categories (when the suggested category does not exist) will be created with `approved: false` and will need manual approval by a super-admin.
- The INVEST standard and acceptance criteria format should be embedded directly in the skill's prompt instructions so the agent never omits them.
- Future enhancement: the skill could be extended to also generate `LearningOutcome` and `Milestone` records as part of the same flow.
- This skill is intentionally separate from the existing `write-a-prd` skill; it consumes an existing codebase rather than producing a planning document, and its output goes directly into the database rather than a Markdown file.

# Plan: Fix Story Title Format in generate-template Skill

> Source PRD: `plans/prd-generate-template-story-title-format.md`

## Architectural decisions

- **Scope**: Single file — `.cursor/skills/generate-template/SKILL.md`
- **No schema or script changes**: `template-wip.json` shape, the persistence script, and the database schema are all unchanged
- **Enforcement mechanism**: Prose rules + worked example inside the skill; the AI interprets these at runtime — no hard validation code needed

---

## Phase 1: Fix Story Title Format Rules

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9

### What to build

Update the User Story Format table in Phase 3 of `SKILL.md` so that:

- The **Title** field rule changes from the "As a `<actor>`, I want `<feature>`, so that `<benefit>`." pattern to a short verb phrase (≤ 6 words, e.g. "Scaffold the Project").
- The **Description** field rule changes to require that its first line is the full "As a…" sentence, followed by the INVEST-aligned narrative (min 3 additional sentences).
- A **worked example** is added directly in the format table showing both fields populated correctly side-by-side, so the AI has a concrete reference to follow.
- A **loop guard rule** is added to the Loop Rules section stating that any generated title matching the "As a…" sentence pattern is invalid and must be regenerated before being presented to the admin.

The end-to-end behavior: when the skill runs, every story it proposes will have a scannable verb-phrase title and a description that opens with the user story sentence — with no manual correction needed from the admin.

### Acceptance criteria

- [ ] The Title row in the format table specifies a verb phrase (≤ 6 words), not the "As a…" sentence
- [ ] The Description row specifies that the first line must be the "As a `<actor>`, I want `<feature>`, so that `<benefit>`." sentence
- [ ] A worked example in the format table demonstrates a correct title ("Scaffold the Project") and a correct description opening ("As a developer, I want to scaffold the project…")
- [ ] The Loop Rules section contains a guard stating titles matching the "As a…" pattern are invalid and must be regenerated
- [ ] Running the skill end-to-end produces stories where no title contains "As a"

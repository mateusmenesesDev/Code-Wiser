## Problem Statement

When using the `generate-template` skill to create a ProjectTemplate, every User Story is assigned a title in the "As a `<actor>`, I want `<feature>`, so that `<benefit>`" format. This is the canonical user story sentence, but it is too long and narrative to serve as a title. Titles are used throughout the platform in compact UI surfaces — sprint boards, backlog lists, story cards — where a 12-word sentence creates visual clutter and is harder to scan than a short verb phrase. The "As a…" sentence is valuable content and should not be lost, but it belongs in the description rather than the title.

## Solution

Update the `generate-template` skill so that every User Story receives:

- A **short verb-phrase title** (e.g. "Scaffold the Project", "Authenticate Users", "Display Blog Post") — concise, action-oriented, immediately scannable.
- A **description** that begins with the full "As a `<actor>`, I want `<feature>`, so that `<benefit>`." sentence as its first line, followed by the INVEST-aligned narrative (minimum 3 sentences).

No changes are required to the database schema, the persistence script, or any other part of the codebase.

## User Stories

1. As a template admin, I want User Story titles to be short verb phrases, so that I can scan the backlog without reading full sentences.
2. As a template admin, I want the "As a…" sentence preserved in the description, so that I retain full context about who the story serves and what value it delivers.
3. As a template admin, I want the description to open with the user story sentence, so that I immediately see the actor and benefit when I open a story.
4. As a template admin, I want the title format rule to be clearly documented in the skill, so that future maintainers understand the convention and do not revert it.
5. As a template admin, I want the skill to reject titles that are full "As a…" sentences and regenerate them as verb phrases, so that the format is enforced consistently across the whole generation loop.
6. As a template admin, I want the example shown in the skill's story presentation to use the new format, so that the skill demonstrates the expected output before I approve or reject a story.
7. As a template admin, I want existing `template-wip.json` sessions that contain stories with old-format titles to be flagged, so that I can choose to regenerate those stories with the correct format.
8. As a template admin, I want the title to be unique across all stories in the same template, so that I never confuse two stories when scanning a list.
9. As a template admin, I want titles to be concise (≤ 6 words), so that they fit cleanly in compact UI surfaces like sprint boards and kanban cards.

## Implementation Decisions

- The change is confined to `SKILL.md` inside `.cursor/skills/generate-template/`.
- The **Title** row in the User Story Format table (Phase 3) must be updated from the "As a…" sentence pattern to a verb-phrase pattern with a ≤ 6-word guideline.
- The **Description** row must be updated to state that the first line must be the full "As a `<actor>`, I want `<feature>`, so that `<benefit>`." sentence, followed by the INVEST narrative (min 3 additional sentences).
- A short worked example should be added to the format table so the AI generates correctly without ambiguity — for example, title: "Scaffold the Project" / description opening: "As a developer, I want to scaffold the project with Next.js 15…".
- No changes are required to `scripts/create-template-from-skill.ts`, the database schema, or `template-wip.json` — the shape of those artefacts is unchanged.
- The Loop rules section (Phase 3) should note that a title matching the "As a…" pattern is invalid and must be regenerated before presenting to the admin.

## Out of Scope

- Migrating or backfilling existing templates already persisted in the database.
- Changes to the database schema or Prisma models.
- Changes to any other skill or script in the repository.
- Enforcing a maximum word count programmatically — the constraint is a guideline for the AI, not a hard validation.

## Further Notes

The change is purely editorial — only the prose rules inside `SKILL.md` need updating. Because the skill is interpreted by an AI at runtime, the quality of the output depends on how precisely the rule is written and whether a concrete example is provided. Including a before/after example directly in the format table is the most reliable way to ensure consistent compliance without code changes.

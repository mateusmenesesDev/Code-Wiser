# Agent Instructions

This file is the canonical AI-agent guidance for this repository. Keep it short and useful for every prompt.

## Architecture rules

- Keep routes thin. `src/app` should compose layouts/pages, route handlers, providers, and boundary code; put domain UI and behavior in `src/features/*`.
- Keep feature code with its domain. Components, hooks, schemas, types, atoms, constants, and utilities belong in the owning feature unless they are genuinely shared.
- Put shared primitives in `src/common`, not feature-specific logic. Avoid turning `common` into a dumping ground.
- Keep database access behind server boundaries. Prefer tRPC procedures/route handlers/RSC helpers over client-side data access.
- Validate inputs at API boundaries with Zod schemas near the owning feature/domain.
- Use `protectedProcedure` or `adminProcedure` for server authorization; UI guards are not a substitute for server checks.
- Separate server state from client state. Use tRPC/React Query for server data and local state/Jotai/URL state only for UI concerns.
- Prefer direct, local code over new abstractions. Extract only when it removes real duplication or creates a clear domain boundary.

## Before changing code

- Read the nearest existing implementation and follow its conventions unless they are actively harmful.
- Preserve feature boundaries and data flow; do not move logic across layers just to make an isolated change easier.
- Check the technical docs when a change touches that area:
  - `docs/technical/design.md` for runtime architecture.
  - `docs/technical/folder-structure.md` for ownership and placement.
  - `docs/technical/authentication.md` for auth and roles.
  - `docs/technical/forms.md` for forms and validation.
  - `docs/technical/query.md` for tRPC/React Query patterns.
  - `docs/technical/principles.md` for broader coding principles.

## Keep out of this file

- Stack inventories, package scripts, setup tutorials, detailed API docs, and instructions that only matter to rare prompts.
- Long examples copied from docs. Link to the relevant doc instead.

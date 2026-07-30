# Development principles

`AGENTS.MD` is canonical. This file gives maintainers the reasoning behind the rules.

## Optimize for local reasoning

- Put behavior where the next maintainer will look first: owning feature, router, or service.
- Keep routes thin and domain code in `src/features/*` / `src/server/api/routers/*`.
- Prefer explicit data flow over hidden global effects.
- Extract only when it removes real duplication or creates a stable domain boundary.

## Boundaries matter

- `src/app` is framework glue, not a domain layer.
- `src/common` is for primitives with multiple real owners; it is not a dumping ground.
- Database access stays behind server boundaries.
- Server authorization lives in procedures/route handlers. UI guards only hide UI.
- Zod validation belongs at API boundaries and near the owning domain.

## State rules

- Server state: tRPC + React Query.
- UI state: local React state, Jotai atoms, or URL state via `nuqs`.
- Form state: React Hook Form.
- Derived state: compute from source state; do not duplicate it unless you need an editable draft.

## Type and validation rules

- Use TypeScript types to describe trusted internal data.
- Use Zod to validate untrusted input: forms, procedure inputs, route bodies, webhook payload assumptions.
- Reuse schema building blocks when it clarifies intent; avoid clever schema factories that hide business rules.
- Avoid `any` and broad casts. If a cast is necessary at an integration boundary, keep it small and explain the shape.

## Mutation rules

- Mutations should be protected by the narrowest correct procedure.
- Check row ownership/membership before writing, even when the user is signed in.
- Invalidate affected queries after successful writes.
- Use optimistic updates only for UX that needs immediacy; rollback must be implemented.

## Design taste

- Boring code beats clever code.
- A longer cohesive function is better than five tiny functions that force jumping around.
- Names should encode domain meaning, not implementation trivia.
- Delete stale examples and dead abstractions instead of documenting around them.
- Add dependencies, global state, or shared abstractions only when the ownership cost is justified.

## Testing and verification

- Test important behavior at the level where the bug would be observed.
- Router tests are useful for authorization, validation, and DB-facing behavior.
- Utility tests are useful for pure transformations and integration payload builders.
- Before claiming a change works, run the relevant check or state that it was not run and why.

## Documentation rules

- Keep docs short, current, and navigational.
- Prefer ownership, data flow, and where-to-look references over copied examples.
- Do not add setup/script/package noise to technical architecture docs.
- If code and docs disagree, inspect code first, then update docs or flag the mismatch.

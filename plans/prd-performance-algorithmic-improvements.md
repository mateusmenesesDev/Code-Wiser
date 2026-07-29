# PRD: Performance & Algorithmic Improvements

## Problem Statement

Code-Wiser is growing in templates, tasks, projects, and users. Several hot paths already use patterns that will degrade under load: catalog queries that ship entire task graphs, N+1 fan-out when listing “my projects,” per-user Clerk membership checks when notifying admins, row-by-row inserts when cloning or bulk-creating template work items, and client kanban/backlog updates that repeatedly scan arrays (including O(n²) optimistic reorder paths).

There is no single user-reported outage today. The work is **preventive**: reduce payload, round-trips, and CPU complexity before scale makes these paths painful, and prove the gains with before/after benchmarks.

## Solution

Ship a phased performance program that:

1. **Shrinks and aggregates server reads** so list/catalog screens never pull full task graphs, and progress/activity come from aggregate queries instead of per-project fan-out.
2. **Persists org-admin membership in the database** (synced from Clerk) so notifications resolve admins with a local query instead of scanning every user against Clerk.
3. **Bulk-writes template clone/bulk-create** using the same ID-remap + `createMany` approach already proven when creating a project from a template.
4. **Unifies and linearizes client reorder/optimistic updates** around shared kanban helpers (Maps / single-pass grouping) so drag, backlog moves, and cache patches stay O(n) / O(n log n).
5. **Establishes a reproducible benchmark suite** (latency, payload size, round-trips, and client microbenchmarks) run before and after each phase on a stress fixture.

User-visible behavior stays the same; APIs and schema may change as long as callers are migrated in the same delivery.

## User Stories

### Catalog & projects discovery

1. As a visitor on the projects catalog, I want approved templates to load with only card-level data (title, description summary fields, category, technologies, cover image, difficulty, access type, credits, task count), so that the first paint stays fast as the catalog grows.
2. As a visitor, I want filtering and search on the catalog to remain correct after the payload shrinks, so that I can still find templates by title, category, difficulty, and access type.
3. As an enrolled user, I want the catalog to still show which templates I already started, so that I do not lose enrollment context on the grid.
4. As a developer opening a template or workspace that needs tasks, I want a dedicated detail/workspace query to load the full task graph only when that screen needs it, so that list pages never pay the detail cost.
5. As an admin publishing or reordering templates, I want cache invalidation to refresh the lean catalog, so that catalog readers see updates without relying on a heavy legacy payload.

### My projects & progress

6. As a mentee on “My projects,” I want progress percentage and last activity for each enrolled project without one network request per metric per project, so that the page scales with how many projects I join.
7. As a mentee, I want progress to reflect completed vs total tasks accurately, so that aggregate queries do not change meaning.
8. As a mentee, I want last activity to remain based on the latest task update in that project, so that relative time labels stay trustworthy.
9. As a mentee with zero tasks in a project, I want progress to show 0% (or the same empty behavior as today), so that edge cases do not regress.

### Admin active projects

10. As an admin on the active projects dashboard, I want each page of projects to include progress aggregates (done/total or equivalent) without embedding every task id/status, so that pagination stays light for large projects.
11. As an admin, I want member search/filter on that dashboard to remain usable, preferably without shipping full member lists solely for client-side search when server filtering is available.
12. As an admin paging through projects, I want cursor pagination behavior preserved, so that infinite scroll / next page still works.

### Project detail / backlog / kanban data shape

13. As a project member opening a project, I want screens that already have their own task queries not to double-fetch a full embedded task list from project-by-id when it is not required for that view.
14. As a project member using the backlog, I want tasks grouped by sprint with a single pass over the task list, so that backlog interactions stay snappy with many sprints and tasks.
15. As a project member dragging in the backlog, I want move/reorder to remain correct while using Set/Map-based membership checks instead of repeated array scans.

### Admin discovery for notifications

16. As the notification system, I want the set of org admins resolved from local user records, so that status/block/PR/comment notifications do not call Clerk once per user in the database.
17. As an operator, I want org-admin role changes in Clerk (grant/revoke) to sync into our database via the existing Clerk webhook pipeline, so that admin notification recipients stay current.
18. As an operator running a one-time backfill, I want existing org admins marked correctly before deploying the new lookup, so that no admin is missed after cutover.
19. As the notification system, if Clerk sync is temporarily stale, I want documented fallback or ops guidance (re-backfill / re-sync) so that admin fan-out can be repaired without restoring the O(U) scan as the default path.
20. As a non-admin user, I want not to receive admin-only task/PR notifications, so that role semantics stay unchanged.

### Template clone & bulk create

21. As an admin cloning a template, I want sprints, epics, and tasks copied with remapped relations in bulk inserts, so that clone time grows roughly with data size rather than with per-row round-trips.
22. As an admin bulk-creating tasks/sprints/epics from JSON, I want the same bulk-insert strategy, so that large imports do not hit long transaction timeouts under normal template sizes.
23. As an admin, I want clone/bulk results to preserve titles, ordering, epic/sprint links, and task fields equivalently to today, so that content fidelity does not regress for speed.
24. As an admin, I want failed clone/bulk operations to roll back cleanly (transactional behavior preserved), so that partial graphs are not left behind.
25. As a mentee creating a project from a template, I want the already-optimized bulk path to remain the reference implementation, so that clone/bulk and project-from-template stay algorithmically aligned.

### Kanban & optimistic updates

26. As a project member dragging a card on the kanban, I want optimistic reorder/status updates to complete in linearithmic time (Maps + per-column sorts), so that large boards do not stutter from nested finds.
27. As a project member, I want filtered kanban views to keep hidden tasks’ relative ranks correct when committing a visible reorder (existing merge semantics preserved), so that filters do not corrupt full-board order.
28. As a project member, I want a single shared reorder/order-update pipeline used by kanban hooks and task optimistic patches, so that we do not maintain two algorithms with different complexity.
29. As a project member, I want kanban column generation to bucket tasks in one pass by status before sorting, so that we avoid scanning the full list once per status.
30. As a project member dragging quickly, I want collision detection to reuse status→id indexes rebuilt when board data changes, so that pointer-move handlers do not refilter the whole board every time if that path is in scope for measurement and gain.
31. As a project member bulk-deleting tasks, I want optimistic cache removal to use a Set of ids, so that delete of many tasks against a large list stays O(n + d).

### Task order persistence

32. As a project member finishing a drag, I want order/status persistence to batch updates efficiently (fewer statements where practical), so that saving a full-column reorder does not become N serial updates without need.
33. As a project member, I want only tasks whose order or status actually changed to be written when the client already computes a diff, so that we do not amplify writes.

### Mentorship & misc server paths (in scope, lower phase)

34. As a mentor/admin viewing mentorship week stats, I want independent count queries to run concurrently (or as one bucketed query), so that dashboard latency is not the sum of serial round-trips.
35. As a weekly job resetting mentee session counters, I want a set-based SQL update where column-to-column assignment is required, so that active mentee count does not imply N individual updates.
36. As an admin listing users with avatars, I want avatar/image resolution to avoid unbounded per-row Clerk fan-out growth (cache or store URL when practical), so that user admin pages stay responsive at the current page size and beyond.

### Benchmarks, quality, and ops

37. As a developer, I want a documented baseline benchmark run **before** each phase lands, so that we know the starting latency, payload bytes, and round-trip counts.
38. As a developer, I want the same benchmark suite run **after** each phase, so that we can prove improvement or catch regressions.
39. As a developer, I want a reproducible **stress fixture** (many templates × many tasks, multiple enrolled projects, large kanban boards), so that gains are visible beyond the default seed.
40. As a developer, I want benchmarks to cover server query/mutation latency, response payload size, HTTP/tRPC round-trip counts for “my projects,” clone/bulk duration, and client microbenchmarks for kanban/backlog helpers.
41. As a developer, I want Vitest (or equivalent) coverage for reorder, merge-visible, grouping, and admin-lookup helpers so that complexity fixes do not break correctness.
42. As a developer, I want performance-sensitive pure helpers to remain unit-testable without Clerk or a browser when possible, so that CI can guard regressions cheaply.
43. As an operator, I want migration/backfill steps for org-admin flags called out clearly, so that deploy order is safe (backfill → code that reads the flag → remove old path).

### Non-regression / product parity

44. As any user, I want filtering, enrollment badges, notifications content, clone fidelity, and kanban/backlog ordering semantics to match pre-change behavior aside from speed and payload size.
45. As an API consumer inside this app, I want TypeScript types and callers updated in the same change set as contract breaks, so that we do not leave a deprecated heavy `getApproved` alongside a lean one.
46. As a future maintainer, I want the project-from-template bulk pattern treated as the standard for copying template graphs, so that new bulk writers do not reintroduce per-row creates.

## Implementation Decisions

### Delivery phases (ordered)

1. **Benchmark harness + stress fixture** — scripts/commands to measure latency, payload size, round-trips, and client microbenchmarks; generate or load a stress dataset; capture baseline numbers before functional changes.
2. **Over-fetch / N+1 reads** — lean approved-template catalog; aggregate “my projects” progress + last activity; slim admin active projects (counts/groupBy instead of embedding all tasks); narrow project-by-id where views already load tasks separately.
3. **Template clone & bulk create writes** — align with project-from-template: pre-generate UUIDs, build sprint/epic id maps, `createMany` (or equivalent bulk) inside a transaction; keep timeouts only as safety nets, not as the primary scaling strategy.
4. **Admin resolution for notifications** — add a persisted org-admin indicator on the user record; extend the Clerk webhook to handle organization membership create/update/delete (or equivalent events) to keep it in sync; one-shot backfill from Clerk; change admin lookup to a local query; remove the all-users × Clerk loop as the default path.
5. **Kanban / backlog / optimistic client paths** — single-pass column bucketing; shared reorder → order-update pipeline for kanban and task optimistic updates; Map/Set for id lookups and bulk-delete; optional collision-detection index cache; batch or reduce task order writes on the server where straightforward.
6. **Lower-priority server polish** — concurrent mentorship counts, set-based weekly session reset SQL, avatar/Clerk fan-out mitigation on user lists.

### Catalog API contract (decision)

- **Hard break:** `getApproved` (or its replacement name if renamed for clarity) returns **catalog-only** fields plus task `_count` (and other card metadata). It no longer includes full task/epic/sprint graphs.
- All in-app consumers (SSR home, catalog hooks/types, invalidations) migrate in the same phase.
- Full graphs remain on existing detail/edit/workspace queries (or a clearly named detail procedure if a gap appears).
- No long-lived dual heavy+lean catalog APIs.

### Admin role persistence (decision)

- No Redis in this stack; do **not** introduce an external cache service for this.
- Persist admin (or org role) on the user model; source of truth for membership remains Clerk; DB is a sync projection for server jobs/notifications that lack a user session.
- Webhook extension is preferred over process-local TTL caches (unreliable under serverless/multi-instance).
- Backfill is mandatory before relying on the flag in production.

### Clone / bulk writes (decision)

- Mirror the project-from-template approach: UUID maps + bulk inserts.
- Accept that bulk insert APIs may not return nested relations; remapping is done in memory before insert, same as project creation.
- Prefer correctness + transactional integrity over micro-batching of individual `create` calls.

### Kanban client (decision)

- **Unify** optimistic reorder/order patches onto the shared kanban reorder helpers (and Map-based updates), rather than only patching nested `.find` loops in place in multiple hooks.
- Preserve `mergeVisibleKanbanItems` semantics for filtered boards.
- Prefer algorithmic clarity (one pass, Maps) over premature micro-optimizations.

### Benchmarking (decision)

- Cover **all** agreed surfaces: server latency, payload bytes, round-trip counts, clone/bulk duration, and client microbenchmarks for hot pure functions.
- Use a **stress fixture** (synthetic large templates/projects/boards) as the primary comparison target; default seed may be recorded but is not sufficient alone.
- Store or document before/after results alongside the phase (e.g. in the plan notes or a benchmarks results section) so improvements are reviewable in PRs.
- Client DnD frame timing may be approximate (microbench of pure helpers + optional manual/React profiling notes); pure helpers must be automated.

### Allowed change surface

- tRPC contracts may break if callers migrate in-repo.
- Prisma schema/migrations allowed (admin flag/role; no unrelated schema churn).
- Raw SQL allowed where Prisma cannot express set-based updates cleanly (e.g. column-to-column weekly reset).
- Caching allowed only if it fits existing infra (DB projection / request-level), not a new Redis dependency.

### Modules / areas touched (conceptual)

- Template queries (catalog vs detail), project list/progress/activity aggregates, admin project list aggregates.
- Notification base admin resolution + Clerk webhook sync + user schema projection.
- Template clone and bulk-create mutations.
- Shared kanban reorder utilities and workspace/task/backlog hooks that patch React Query caches.
- Task order update mutation batching where practical.
- Mentorship query/service polish in the final phase.
- New benchmark scripts and stress data generation under the repo’s scripts/testing conventions.

## Out of Scope

- Fixing or optimizing **AI model latency** / rewrite quality.
- **Seed-only** generator performance, unless a change is a trivial reuse of the production bulk pattern with no product risk.
- UX/visual redesigns, new product features, or catalog UI redesign beyond what contract changes require.
- CDN, hosting, Postgres instance sizing, or other infra upgrades.
- Introducing **Redis** or another external cache product.
- Changing notification product rules (who gets notified about what), aside from how the admin recipient set is resolved.
- Changing kanban/backlog **product semantics** (statuses, filter meaning, merge-of-hidden-tasks rules) — only the algorithms implementing them.
- Public external API versioning for third parties (this app is the consumer).
- Full end-to-end browser performance budgets in CI (optional manual notes only); automated focus is scripts + unit/microbench.

## Further Notes

- Reference pattern already in production: creating a project from a template uses in-memory id maps and bulk inserts — clone/bulk should converge on that, not invent a third approach.
- Biggest expected wins are payload/round-trip reductions (catalog, my projects, admin projects, admin Clerk scan), then clone I/O, then client O(n²) paths on large boards.
- Prefer proving each phase with the benchmark suite before stacking the next phase’s claims.
- Deploy caution for admin sync: backfill → dual-read verification (optional short period) → cutover to DB-only lookup → delete the O(U) Clerk fan-out.
- If stress-fixture generation is expensive in CI, gate heavy benches behind an explicit script/command; keep correctness tests always on.
)

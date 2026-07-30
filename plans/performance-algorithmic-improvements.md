# Plan: Performance & Algorithmic Improvements

> Source PRD: [prd-performance-algorithmic-improvements.md](./prd-performance-algorithmic-improvements.md)

## Architectural decisions

Durable decisions that apply across all phases:

- **API contracts**: Catalog listing is a hard break — approved-template list returns card metadata + task counts only; full graphs stay on detail/workspace/edit queries. In-app callers migrate in the same phase as the break. No long-lived dual heavy+lean catalog APIs.
- **Schema**: Persist an org-admin projection on `User` (boolean flag and/or org role field). Clerk remains source of truth for membership; the DB field is a sync projection for jobs/notifications without a session.
- **Auth / third parties**: Extend the existing Clerk webhook to sync organization membership changes into the user projection. No Redis or new cache product.
- **Bulk graph copy**: Template clone and bulk-create follow the same pattern as project-from-template — pre-generated UUIDs, in-memory sprint/epic id maps, bulk inserts inside a transaction.
- **Client reorder**: One shared kanban reorder → order-update pipeline (Maps / single-pass bucketing) for optimistic kanban and task cache patches; preserve filtered-board merge semantics for hidden tasks.
- **Benchmarking**: Reproducible stress fixture + suite covering latency, payload size, round-trips, clone/bulk duration, and client microbenchmarks. Baseline before each phase; after numbers in the same suite. Heavy benches may be an explicit script; correctness tests always in CI.
- **Out of scope (unchanged)**: AI latency, UX redesign, CDN/infra sizing, seed-only work unless trivial reuse of the bulk pattern, notification _product_ rules, kanban/backlog product semantics.

---

## Phase 1: Benchmark harness + stress fixture

**User stories**: 37, 38, 39, 40, 42

### What to build

A runnable benchmark suite and a reproducible stress dataset large enough to expose catalog, list, clone, and kanban costs. The suite records server latency, response payload size, round-trip counts for multi-query pages, clone/bulk duration, and client microbenchmarks for pure reorder/grouping helpers. Capture and document a baseline run with no product behavior changes yet.

### Acceptance criteria

- [x] Stress fixture can be created/loaded repeatedly with documented scale (templates × tasks, enrolled projects, board size)
- [x] Suite measures latency, payload bytes, round-trips, clone/bulk duration, and client helper microbenchmarks
- [x] Baseline results are recorded before Phase 2+ changes
- [x] Pure helpers used in benches remain unit-testable without Clerk or a browser
- [x] Heavy bench command is documented; correctness tests stay in normal CI

---

## Phase 2: Lean catalog (approved templates hard break)

**User stories**: 1, 2, 3, 4, 5, 45

### What to build

Ship a catalog-only approved-templates response (metadata, cover, technologies, category, access/difficulty/credits, task `_count`) and migrate SSR home, catalog hooks/types, and invalidations. Screens that need the full graph keep using detail/edit/workspace queries. Filtering, search, and enrollment badges on the catalog remain correct. Re-run catalog benchmarks vs Phase 1 baseline.

### Acceptance criteria

- [x] Catalog payload no longer includes full task/epic/sprint graphs
- [x] All in-app catalog consumers compile and behave correctly against the lean contract
- [x] Detail/workspace/edit paths still load full graphs when needed
- [x] Filters (title, category, difficulty, access) and “already started” indicators still work
- [x] After-benchmark shows material reduction in catalog payload size and/or latency vs baseline

---

## Phase 3: My projects aggregates (end N+1)

**User stories**: 6, 7, 8, 9

### What to build

Replace per-project progress and last-activity fan-out with an aggregated read path for enrolled projects (done/total progress and latest task activity per project). “My projects” UI consumes the aggregate without one request pair per project. Empty projects keep today’s empty/zero progress meaning. Benchmark round-trips and latency vs baseline.

### Acceptance criteria

- [x] Progress and last activity for enrolled projects do not require O(P) metric round-trips
- [x] Progress meaning (completed vs total) matches pre-change behavior
- [x] Last activity remains based on latest task update in the project
- [x] Zero-task projects behave as today (0% / empty)
- [x] After-benchmark shows reduced round-trips and improved list latency under the stress fixture

---

## Phase 4: Admin active projects slim + project detail narrowing

**User stories**: 10, 11, 12, 13

### What to build

Slim the admin active-projects page data: progress via counts/aggregates instead of embedding every task id/status; keep cursor pagination. Prefer server-side member search/filter when the dashboard needs it, instead of shipping full member lists only for client search. Narrow project-by-id so views that already load tasks do not double-fetch an embedded full task list. Benchmark admin list payload vs baseline.

### Acceptance criteria

- [ ] Admin project pages include progress aggregates without full per-project task arrays
- [ ] Cursor pagination / next page behavior is unchanged
- [ ] Member search/filter remains usable (server-side if that avoids heavy payloads)
- [ ] Project detail no longer double-embeds full tasks for views that fetch tasks separately
- [ ] After-benchmark shows smaller admin list payloads at stress scale

---

## Phase 5: Org-admin sync + local admin lookup

**User stories**: 16, 17, 18, 19, 20, 43

### What to build

Add the org-admin projection on `User`, extend the Clerk webhook for organization membership lifecycle events, and run a one-shot backfill. Notification admin resolution uses a local query. Document deploy order (backfill → cutover → remove all-users × Clerk scan) and ops repair (re-backfill) if sync drifts. Non-admins must not receive admin-only notifications. Benchmark/notification path no longer scales with total user count × Clerk.

### Acceptance criteria

- [ ] Schema projection exists and is populated by backfill for current org admins
- [ ] Membership grant/revoke in Clerk updates the projection via webhook
- [ ] Notification admin recipient lookup is a local DB query (no default O(U) Clerk fan-out)
- [ ] Deploy/backfill order is documented; old scan is removed after cutover
- [ ] Admin-only notification targeting semantics are unchanged for non-admins
- [ ] Stress/path check shows admin resolution cost independent of total non-admin user count

---

## Phase 6: Template clone & bulk create via bulk inserts

**User stories**: 21, 22, 23, 24, 25, 46

### What to build

Rewrite template clone and JSON bulk-create to use UUID remapping + bulk inserts inside a transaction, aligned with project-from-template. Preserve field fidelity (titles, order, epic/sprint links, task fields) and rollback on failure. Project-from-template remains the reference pattern. Benchmark clone/bulk duration on the stress fixture.

### Acceptance criteria

- [ ] Clone and bulk-create use bulk inserts with in-memory id remaps (not per-row creates as the primary path)
- [ ] Cloned/imported graphs match pre-change content fidelity
- [ ] Failures roll back; no partial graphs left behind
- [ ] Project-from-template path remains correct and is the documented standard for graph copy
- [ ] After-benchmark shows materially lower clone/bulk duration at stress scale

---

## Phase 7: Shared kanban / backlog client pipeline

**User stories**: 14, 15, 26, 27, 28, 29, 30, 31, 41

### What to build

Unify optimistic reorder and order patches onto the shared kanban helpers (Maps, single-pass status bucketing, Set-based bulk delete). Backlog sprint grouping becomes one pass; membership checks use Sets. Preserve filtered-board merge semantics. Add/extend unit tests for reorder, merge-visible, and grouping helpers. Optional: cache status→id indexes for collision detection when board data changes. Microbenchmark client helpers vs Phase 1 baseline.

### Acceptance criteria

- [ ] Kanban optimistic updates and task order cache patches share one reorder → order-update pipeline
- [ ] Column generation / backlog grouping avoid repeated full-list scans per status/sprint
- [ ] Filtered kanban merge semantics for hidden tasks are preserved
- [ ] Bulk-delete optimistic removal is Set-based (O(n + d))
- [ ] Unit tests cover reorder, merge-visible, and grouping correctness
- [ ] Client microbenchmarks improve (or stay equal) vs nested-find baseline on large boards

---

## Phase 8: Task order write batching

**User stories**: 32, 33

### What to build

Make persisting drag order/status updates efficient: batch or reduce statements where practical, and prefer writing only tasks whose order or status actually changed when the client already diffs. Behavior for concurrent access and auth checks stays correct. Benchmark a full-column reorder write path under stress.

### Acceptance criteria

- [ ] Full-column reorder persistence is not N serial updates without need
- [ ] Unchanged order/status rows are not written when a client diff is available
- [ ] Authorization and transactional safety for order updates remain correct
- [ ] After-benchmark shows improved reorder persistence latency or statement count at stress scale

---

## Phase 9: Server polish (mentorship + avatars)

**User stories**: 34, 35, 36

### What to build

Run mentorship week count queries concurrently or as one bucketed query; replace per-user weekly session resets with a set-based SQL update where column-to-column assignment is required; reduce avatar/Clerk fan-out on admin user lists (store or cache image URL when practical). Re-run relevant benches and close the performance program with final before/after notes.

### Acceptance criteria

- [ ] Mentorship week stats are not limited by serial independent count latency
- [ ] Weekly session reset updates active mentees in a set-based statement
- [ ] User list avatars do not grow as unbounded per-row Clerk calls beyond current page needs (mitigation in place)
- [ ] Final benchmark summary documents cumulative gains vs Phase 1 baseline for the program’s target paths

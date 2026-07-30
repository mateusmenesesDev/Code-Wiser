# Benchmark results

JSON reports from `bun run bench` / `bun run bench:full`.

| File | Notes |
| --- | --- |
| `baseline-phase1.json` | Client-only baseline (default board size 400) |
| `baseline-phase1-full.json` | Client + server baseline against seeded `__PERF_STRESS__` data at default scale (20×150 tasks, 12 projects). Catalog payload ≈ **2.08 MB** |
| `after-phase-2.json` | After lean `getApproved`. Same stress scale; catalog payload ≈ **14.7 KB** (~99% smaller) |
| `after-phase-3.json` | After enrolled aggregates. My-projects **round-trips: 25 → 1** (1 list + 2×P fan-out removed) |
| `after-phase-4.json` | After slim admin list + narrow `getById`. Admin page lean vs heavy payload ≈ **10 KB vs 43 KB** |
| `after-phase-5.json` | Org-admin projection: admin resolution **O(U) Clerk → O(1) local `isOrgAdmin` query** |
| `after-phase-6.json` | Template clone + bulk-create use UUID maps + `createMany` (same as project-from-template). `bulkInsertClone` ≈ **1.9s** mean for 150 tasks (3 inserts vs prior per-row creates) |
| `after-phase-7.json` | Shared kanban/backlog pipeline (Maps, Set delete, single-pass grouping). Client means equal/better vs Phase 1 on 400-task boards |
| `after-phase-8.json` | Task order writes: one `UPDATE ... FROM VALUES` + skip unchanged. 40-task reorder **~5.4s serial → ~0.25s bulk** (40 stmts → 1) |
| `after-phase-9.json` | Mentorship week stats: 4 serial counts → 1 range query; weekly reset set-based; user list avatars from `User.imageUrl` (0 Clerk/page when projected) |

Compare later phases by re-running with `--label after-phase-N` and diffing the same metrics (catalog `payloadBytes`, my-projects `roundTrips`, clone `bulkInsertClone`, client means).

## Cumulative gains vs Phase 1 baseline

Stress scale unless noted: 20 templates × 150 tasks, 12 enrolled projects, 400-task boards.

| Path | Phase 1 baseline | After Phase 9 | Gain |
| --- | --- | --- | --- |
| Catalog payload (`getApproved`) | ~2.08 MB | ~14.7 KB | ~99% smaller |
| My-projects round-trips | 25 (1 + 2×P) | 1 | −24 fan-out queries |
| Admin active projects payload | heavy ~43 KB | lean ~10 KB | ~77% smaller list rows |
| Org-admin notification recipients | O(U) Clerk membership scan | O(1) `User.isOrgAdmin` | Independent of non-admin count |
| Template clone graph write | Per-row creates (pre-change) | 3× `createMany` / ~1.8–1.9s @ 150 tasks | Aligns with project-from-template |
| Client kanban helpers (400 tasks) | Nested-find era | Shared Map/Set pipeline | Equal/better microbench means |
| Task order persist (40 tasks) | 40 serial updates ~5.3–5.4s | 1 bulk UPDATE ~0.25s | ~20× faster; 40→1 statements |
| Mentorship week stats | 4 serial `count`s | 1 `findMany` + bucket | Latency ≈ one query |
| Weekly session reset | N `user.update`s | 1 column-to-column `UPDATE` | Active mentee count ≠ N statements |
| Admin user list avatars | N Clerk `getUser` / page | DB `imageUrl` (webhook + backfill) | 0 Clerk calls when projected |

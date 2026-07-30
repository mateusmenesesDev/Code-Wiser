# Benchmark results

JSON reports from `bun run bench` / `bun run bench:full`.

| File | Notes |
| --- | --- |
| `baseline-phase1.json` | Client-only baseline (default board size 400) |
| `baseline-phase1-full.json` | Client + server baseline against seeded `__PERF_STRESS__` data at default scale (20×150 tasks, 12 projects). Catalog payload ≈ **2.08 MB** |
| `after-phase-2.json` | After lean `getApproved`. Same stress scale; catalog payload ≈ **14.7 KB** (~99% smaller) |
| `after-phase-3.json` | After enrolled aggregates. My-projects **round-trips: 25 → 1** (1 list + 2×P fan-out removed) |
| `after-phase-4.json` | After slim admin list + narrow `getById`. Admin page lean vs heavy payload ≈ **10 KB vs 43 KB** |

Compare later phases by re-running with `--label after-phase-N` and diffing the same metrics (catalog `payloadBytes`, my-projects `roundTrips`, clone `bulkInsertClone`, client means).

# Benchmark results

JSON reports from `bun run bench` / `bun run bench:full`.

| File | Notes |
| --- | --- |
| `baseline-phase1.json` | Client-only baseline (default board size 400) |
| `baseline-phase1-full.json` | Client + server baseline against seeded `__PERF_STRESS__` data at default scale (20×150 tasks, 12 projects) |

Compare later phases by re-running with `--label after-phase-N` and diffing the same metrics (catalog `payloadBytes`, my-projects `roundTrips`, clone `bulkInsertClone`, client means).

# Performance benchmarks

Harness for the [performance plan](../../plans/performance-algorithmic-improvements.md) (Phase 1+).

## Documented stress scale

Default (`DEFAULT_STRESS_SCALE`):

| Dimension | Default |
| --- | ---: |
| Templates | 20 |
| Tasks per template | 150 |
| Total catalog tasks | 3000 |
| Enrolled projects | 12 |
| Kanban board tasks (client) | 400 |
| Sprints / epics per template | 4 / 3 |

Stress rows are titled with the prefix `__PERF_STRESS__` so they can be cleaned without touching product data.

## Commands

```bash
# Unit-testable pure helpers (CI)
bun run test -- src/server/benchmarks/ --run

# Client microbenchmarks only (no DB) — writes JSON report
bun run bench -- --label baseline-phase1 --out benchmarks/results/baseline-phase1.json

# Seed DB stress fixture (requires Infisical / DATABASE_URL)
bun run bench:seed
bun run bench:seed -- --templates 5 --tasks 40 --projects 4
bun run bench:seed:clean

# Full suite: client + server (catalog payload, my-projects fan-out, clone bulk path)
bun run bench:full -- --label baseline-phase1-full --out benchmarks/results/baseline-phase1-full.json
```

## What is measured

- **Client**: `reorderKanbanItems`, `toKanbanOrderUpdates`, sprint `groupBy` on a stress-sized board
- **Server** (with DB + seed): approved-catalog query latency/payload for stress templates, my-projects-style round-trips + latency, template graph load, in-memory id remap, transactional bulk-insert clone (then deleted)

Heavy benches are explicit (`bench` / `bench:full`). Correctness tests under `src/server/benchmarks/*.test.ts` stay in normal CI.

Phase 1 baselines are checked in under [`benchmarks/results/`](../../benchmarks/results/).

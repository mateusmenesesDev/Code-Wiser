# Query and mutation patterns

tRPC + React Query is the server-state layer. Keep server state here; keep UI state local/Jotai/URL.

## Setup

- `src/server/api/root.ts`: composes domain routers into `appRouter`.
- `src/server/api/trpc.ts`: context, procedures, SuperJSON transformer, Zod error formatter.
- `src/app/api/trpc/[trpc]/route.ts`: HTTP handler for Client Components.
- `src/trpc/react.tsx`: `api` hooks, `TRPCReactProvider`, browser QueryClient singleton, `httpBatchStreamLink`, logger.
- `src/trpc/server.ts`: RSC caller and hydration helpers.
- `src/trpc/query-client.ts`: React Query defaults, SuperJSON hydration/dehydration, `staleTime: 30s`.

## Queries

- Client Components use `api.<router>.<procedure>.useQuery(input, options)`.
- Server Components use `api.<router>.<procedure>(input)` from `src/trpc/server.ts` and pass/hydrate data into Client Components when needed.
- Use stable input objects that match procedure input shape.
- Derive filtered/sorted/enriched views with `useMemo`; do not create extra client state for derived server data.
- Use `api.useQueries` only when a batch of independent per-item queries is clearer than changing the server API. If every screen needs the joined data, add a server query instead.

## Mutations

- Client Components use `api.<router>.<procedure>.useMutation`.
- On success, invalidate the narrowest affected queries through `api.useUtils()`.
- Prefer invalidation over manual cache writes unless immediate UX matters.
- Optimistic updates must cancel affected queries, snapshot previous data, write the optimistic shape, rollback on error, and invalidate on settle.
- Navigation/toasts/dialog resets belong in mutation callbacks or thin feature hooks.

## Server procedures

- Use `publicProcedure`, `protectedProcedure`, `adminProcedure`, or `mentorshipProcedure` deliberately.
- Validate input with Zod via `.input(...)` at the procedure boundary.
- Keep DB access in routers/actions/services, not in feature Client Components.
- Return shapes designed for the screen/domain. Avoid making clients stitch together many queries when a single cohesive server query is simpler.

## Cache and hydration

- Default query stale time is already set in `src/trpc/query-client.ts`; avoid per-query overrides unless behavior needs it.
- Server-prefetched data should not immediately refetch on the client without reason.
- Invalidate list and detail queries that can be stale after a mutation; do not blanket-invalidate unrelated routers.

## Error handling

- tRPC formats Zod errors under `error.data.zodError`.
- Use field errors for forms when actionable; otherwise show a concise toast/message.
- Non-tRPC route handlers should return explicit status codes with `NextResponse`/`Response`.

## Where to look

- Project/template/task mutation examples: `src/features/*/hooks`, `src/server/api/routers/project`, `template`, `task`.
- Optimistic task helpers: `src/features/task/utils/optimisticData*.ts`.
- Kanban data flow: `src/features/kanban/hooks/*`, `src/server/api/routers/kanban`.
- RSC hydration examples: pages under `src/app/(system)` plus `src/trpc/server.ts`.

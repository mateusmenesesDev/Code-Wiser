# System design

Architecture guidance for maintainers and agents. `AGENTS.MD` is canonical; this file explains the runtime shape and where ownership lives.

## Runtime shape

- Next.js App Router owns routing and server/client boundaries in `src/app`.
- `src/app/layout.tsx` installs global providers: Clerk, Jotai, tRPC/React Query, nuqs, theme, header, toaster, and hydration.
- `src/middleware.ts` runs Clerk middleware so `auth()` and session claims work during requests.
- tRPC is the main application API. HTTP entrypoint is `src/app/api/trpc/[trpc]/route.ts`; routers are composed in `src/server/api/root.ts`.
- Prisma access starts at `src/server/db.ts` and should stay behind server code: tRPC procedures, route handlers, or RSC helpers.
- React Server Components can call tRPC through `src/trpc/server.ts`; Client Components use hooks from `src/trpc/react.tsx`.

## Boundaries

- `src/app`: pages, layouts, route handlers, providers, and other framework boundary code. Keep it thin.
- `src/features/*`: domain UI, hooks, schemas, types, atoms, utilities, and feature-specific behavior.
- `src/server/api/routers/*`: domain API procedures. Validate inputs here and enforce authorization here.
- `src/common`: shared UI primitives, layout pieces, hooks, atoms, constants, and utilities that are genuinely cross-feature.
- `src/server/services/*` and `src/server/realtime/*`: external/server integrations and adapters.
- `prisma/models/*`: database model ownership. Schema changes usually require matching router and feature updates.

## Data flow

1. Route/page in `src/app` composes feature components or fetches server data.
2. Client features call `api.<router>.<procedure>.useQuery/useMutation`.
3. tRPC context in `src/server/api/trpc.ts` provides `{ db, realtime, session, isAdmin, headers }`.
4. Procedures validate input with Zod schemas near the owning feature/domain and perform DB/service work.
5. React Query caches server data; invalidate affected procedures after mutations.
6. UI-only state stays local, in Jotai atoms, or in URL state via `nuqs`.

## Authorization

- Server checks are mandatory. Use `protectedProcedure`, `adminProcedure`, or `mentorshipProcedure` in `src/server/api/trpc.ts`.
- UI checks such as Clerk `<Protect role="org:admin">` are only presentation guards.
- Route handlers that bypass tRPC must call `auth()` and validate inputs themselves.

## Feature map

- Projects/templates/workspace/task/sprints/epics/comments: project catalog and work management.
- Kanban/backlog/planningPoker: workspace interaction and realtime planning flows.
- Auth/users/checkout/mentorship/notifications/prReview/feedback: supporting product domains and integrations.
- AI, Stripe, Clerk, UploadThing, Cal.com, email, and realtime code live at route-handler or server-service boundaries.

## Where to look first

- Runtime/API setup: `src/app/layout.tsx`, `src/server/api/trpc.ts`, `src/server/api/root.ts`, `src/trpc/*`.
- Ownership/placement: `docs/technical/folder-structure.md`.
- Auth and roles: `docs/technical/authentication.md`.
- Forms/schemas: `docs/technical/forms.md`.
- Queries/mutations/cache: `docs/technical/query.md`.
- Development principles: `docs/technical/principles.md`.

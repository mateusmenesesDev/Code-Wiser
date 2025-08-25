## System Design Overview

This document outlines the high-level architecture and design choices for the app.

### Stack

- Next.js App Router (server components + client components)
- tRPC v11 for type-safe API between server and client
- Prisma + PostgreSQL for data access
- Clerk for auth and org roles
- React Query for client-side caching/hydration
- Stripe for payments; UploadThing for file uploads
- TailwindCSS, Radix UI, ShadCN components

### Runtime Architecture

- App entry: `src/app/layout.tsx` wraps with `ClerkProvider`, `JotaiProvider`, `TRPCReactProvider`, `NuqsAdapter`, and `ThemeProvider`. It also syncs the active organization via `SyncActiveOrganization`.
- Middleware: `src/middleware.ts` runs Clerk middleware to attach session/claims to requests.
- Server API: tRPC handlers exposed at `src/app/api/trpc/[trpc]/route.ts`, wired to `appRouter` and `createTRPCContext`.
- Webhooks: `src/app/api/webhooks/*` for Clerk and Stripe events.
- Uploads: `src/app/api/uploadthing/*` for authenticated uploads.

### Data Access

- Prisma client is created in `src/server/db.ts` with global reuse in dev.
- All DB access flows through tRPC procedures, which receive `{ db, session, isAdmin }` in context.

### API Layer (tRPC)

- Root router: `src/server/api/root.ts` aggregates routers: `user`, `project`, `projectTemplate`, `task`, `sprint`, `epic`, `comment`.
- Context: `src/server/api/trpc.ts` builds context with Clerk `auth()` and computes `isAdmin` from org claims.
- Procedures: `publicProcedure`, `protectedProcedure`, `adminProcedure` implement auth/role checks and unified error/transformer config (SuperJSON).
- Clients:
  - RSC: `src/trpc/server.ts` creates a cached caller with auth-aware headers.
  - Client: `src/trpc/react.tsx` sets up `api` with `httpBatchStreamLink`, `loggerLink`, and shared `QueryClient`.

### Feature Modules

- Projects: list enrolled, get by id, compute progress, create from template. UI for catalog, detail, and workspace.
- Project Templates: admin CRUD, images, status, and public queries for catalog.
- Tasks: list/create/update/delete, ordering, relations to sprint/epic, comments.
- Sprints: list and CRUD; ordering.
- Epics: list and CRUD.
- Comments: list and CRUD.

### Client State and Data Fetching

- React Query is used under the hood by tRPC React bindings for caching, hydration, and request batching.
- `src/trpc/query-client.ts` configures SuperJSON serialization and hydration behavior.
- URL state and filters use `nuqs` where applicable (e.g., task filters).

### AuthN/AuthZ

- Clerk provides session and org claims via middleware and `auth()`.
- UI authorization uses `<Protect role="org:admin">`.
- Server authorization uses `protectedProcedure` and `adminProcedure`.
- See `docs/technical/authentication.md` for full details.

### Payments and Credits

- Checkout: `src/app/api/checkout_sessions/route.ts` creates Stripe sessions tied to the user and specific price IDs.
- Webhooks: `src/app/api/webhooks/stripe/route.ts` handles credit addition and mentorship subscription updates.

### Uploads

- `src/app/api/uploadthing/core.ts` enforces auth in middleware for image uploads.

### UI Composition

- Reusable UI components in `src/common/components/ui`.
- Feature-oriented components in `src/features/*/components`.
- Workspace: Kanban board, Backlog with DnD, Stats, Header, and Design file card.

### Error Handling

- tRPC error formatter includes Zod errors; client logs enabled in development.
- Route handlers use `NextResponse.json` with status codes for failures.

### Testing

- Example tests: `src/server/api/routers/template/tests/project.test.ts` use mocked DB and mocked Clerk `auth()`.

### Conventions

- Type-safe schemas via Zod in `src/features/*/schemas`.
- Single-responsibility modules and DRY utilities.

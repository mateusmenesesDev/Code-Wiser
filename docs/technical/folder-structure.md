# Folder structure

Use this as a placement and ownership map. Prefer nearby feature code over new shared abstractions.

## Root

- `src/`: application source.
- `prisma/`: Prisma schema models, migrations, and seed data.
- `docs/`: maintainer docs. `docs/technical/*` should stay short and architecture-useful.
- `public/`: static assets.
- `AGENTS.MD`: canonical agent guidance.

## `src/app`

Framework boundary only: route segments, layouts, route handlers, metadata, providers.

Notable paths:

- `layout.tsx`: global providers and app shell.
- `(auth)/sso-callback/page.tsx`: Clerk OAuth callback.
- `(system)/*`: product pages such as catalog, projects, workspace, pricing, admin, mentorship.
- `api/trpc/[trpc]/route.ts`: tRPC HTTP handler.
- `api/checkout_sessions/route.ts`: Stripe checkout.
- `api/webhooks/*/route.ts`: Clerk, Stripe, Cal.com webhooks.
- `api/uploadthing/route.ts`: UploadThing handler.

Rule: pages should compose feature components and server helpers; move domain behavior to `src/features` or `src/server/api/routers`.

## `src/features`

Feature modules own product behavior. Keep components, hooks, schemas, types, atoms, constants, and feature utilities with the domain.

Current domains include:

- `auth`, `users`: Clerk-facing UI/hooks and admin user UI.
- `projects`, `templates`: catalog, project detail, template admin, template schemas.
- `workspace`, `task`, `backlog`, `kanban`, `sprints`, `epics`: project work management UI/state.
- `planningPoker`: planning poker UI, realtime client hook, local atoms/types.
- `checkout`, `mentorship`: payments and mentorship booking UI/schemas.
- `notifications`, `prReview`, `feedback`: supporting product domains.
- `schemas`: only shared validation building blocks; do not put feature-specific schemas here.

Common internal folders are `components/`, `hooks/`, `schemas/`, `types/`, `utils/`, `atoms/`, and `constants/`. Create only the folders a feature actually needs.

## `src/server`

Server-only ownership.

- `api/trpc.ts`: tRPC context, procedure types, auth middleware, error formatting.
- `api/root.ts`: app router composition.
- `api/routers/<domain>`: tRPC queries/mutations/actions/utils/tests by domain.
- `db.ts`: Prisma client singleton.
- `services/*`: server integrations such as Cal.com, email, mentorship, notifications.
- `realtime/*`: realtime interface and Pusher adapter.
- `utils/*`: server-only utilities shared across server domains.
- `__mocks__/*`: test mocks.

Rule: database access belongs here or in route handlers/RSC server helpers, not in Client Components.

## `src/common`

Shared client-side primitives only.

- `components/ui`: shadcn/Radix-style primitives.
- `components/layout`: app-wide layout pieces.
- `components/icons`: shared icons.
- `hooks`, `atoms`, `constants`, `utils`: cross-feature code.

Do not move feature-specific logic into `common` to avoid imports. Shared code should have multiple real owners and a stable interface.

## Other source folders

- `src/trpc`: RSC/client tRPC bindings and QueryClient config.
- `src/providers`: app-level providers not owned by a feature.
- `src/services`: client-safe service wrappers; server integrations belong in `src/server/services`.
- `src/lib`: tiny framework/library utilities such as `cn` and base URL helpers.
- `src/styles`: global CSS.
- `src/types`: global declarations only.
- `src/env.js`: environment validation.
- `src/middleware.ts`: Next middleware.

## Prisma

- `prisma/schema.prisma`: generator/datasource and model includes.
- `prisma/models/*`: split model files for users, projects, templates, management, mentorship, notifications, planning poker, feedback, enums.
- `prisma/migrations/*`: generated schema history.
- `prisma/seed/*`: seed orchestration, data, generators, reset utilities.

## Placement checklist

- New page/route handler? `src/app`.
- New domain UI/hook/schema/type? Owning `src/features/<domain>`.
- New API operation? `src/server/api/routers/<domain>` and add router to `src/server/api/root.ts` if new.
- New DB-backed operation? Server boundary plus Zod input validation.
- New reusable primitive? `src/common`, only after proving it is not domain-specific.
- New integration? Route handler at the boundary, implementation in `src/server/services` when reused or complex.

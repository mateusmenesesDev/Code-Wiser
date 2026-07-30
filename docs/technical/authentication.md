# Authentication and authorization

Clerk provides identity and organization claims. tRPC procedures enforce server authorization. UI guards are not enough.

## Key files

- `src/middleware.ts`: `clerkMiddleware()` attaches Clerk auth context to requests.
- `src/app/layout.tsx`: wraps the app in `ClerkProvider` and renders `SyncActiveOrganization`.
- `src/features/auth/components/SyncActiveOrganizations.tsx`: sets the active org from `sessionClaims.membership` when none is active.
- `src/server/api/trpc.ts`: creates tRPC context and exports `publicProcedure`, `protectedProcedure`, `adminProcedure`, `mentorshipProcedure`.
- `src/app/api/trpc/[trpc]/route.ts`: tRPC HTTP boundary.
- `src/trpc/server.ts`: RSC tRPC caller with request headers.
- `src/app/api/webhooks/clerk/route.ts`: verifies Clerk webhooks and mirrors user create/update/delete into the DB.
- `src/app/api/uploadthing/core.ts`: upload auth boundary.

## Runtime flow

1. Request enters Next.js and Clerk middleware makes `auth()` available.
2. Root layout installs Clerk and syncs a default active organization client-side.
3. tRPC context calls `auth()`, exposes `session`, and computes `isAdmin` from org role claims.
4. Procedures enforce access:
   - `publicProcedure`: no login requirement.
   - `protectedProcedure`: requires `ctx.session.userId`.
   - `adminProcedure`: requires signed-in user and admin org role.
   - `mentorshipProcedure`: requires signed-in user with DB `mentorshipStatus === 'ACTIVE'`.
5. Webhooks and route handlers that bypass tRPC must call `auth()` or verify their own webhook signatures.

## Roles and claims

- Clerk org claims are read from `session.sessionClaims?.o` with `{ id, rol, slg }` shape.
- Admin is true when `rol === 'admin'` or `session.has({ role: 'org:admin' })`.
- Use Clerk `<Protect role="org:admin">` only for hiding UI; use `adminProcedure` for the actual server permission check.

## Patterns

- New user-owned tRPC operation: use `protectedProcedure`; read `ctx.session.userId`; check row ownership/membership before DB writes.
- New admin operation: use `adminProcedure` even if the page is under `/admin`.
- New mentorship-only operation: use `mentorshipProcedure` or share the domain check in `src/features/mentorship/utils` / `src/server/services/mentorship` when appropriate.
- New route handler: call `auth()` from `@clerk/nextjs/server`, reject missing `userId`, validate request body, then perform work.
- New webhook: verify provider signature first; webhook trust does not come from Clerk session.

## User mirroring

`src/app/api/webhooks/clerk/route.ts` handles:

- `user.created`: creates an app DB user for Google/GitHub OAuth users.
- `user.updated`: updates email/name.
- `user.deleted`: deletes by Clerk user ID.

If user fields or onboarding state change, update the Prisma user model and this webhook path together.

## Environment ownership

`CLERK_WEBHOOK_SECRET` is validated in `src/env.js` and required by the Clerk webhook route. Clerk publishable/secret keys are deployment configuration, not code-level setup guidance.

## Review checklist

- Is every server mutation protected by the right tRPC procedure or `auth()` check?
- Is ownership checked after authentication, not inferred from UI state?
- Are admin-only pages backed by `adminProcedure`?
- Are webhook handlers signature-verified before side effects?

## Authentication Overview

This app uses Clerk for authentication and organization-based authorization, integrated with Next.js App Router and tRPC.

- Clerk middleware protects requests and injects auth context.
- Server-side auth is accessed via `auth()` and tRPC context.
- UI is conditionally rendered with Clerk’s `Protect` component.
- Roles are organization-scoped; "admin" grants elevated access.

### Key files

- `src/middleware.ts`: `clerkMiddleware()` for request auth context.
- `src/app/layout.tsx`: wraps app in `ClerkProvider` and syncs active org.
- `src/features/auth/components/SyncActiveOrganizations.tsx`: auto-sets org.
- `src/server/api/trpc.ts`: creates tRPC context with session and role; defines `publicProcedure`, `protectedProcedure`, `adminProcedure`.
- `src/app/api/trpc/[trpc]/route.ts` and `src/trpc/server.ts`: wire tRPC handlers and RSC caller with auth-aware headers.
- `src/app/api/webhooks/clerk/route.ts`: verifies Clerk webhooks (create/update/delete user in DB).
- `src/app/(auth)/sso-callback/page.tsx`: handles OAuth redirect with Clerk.
- `src/app/api/uploadthing/core.ts`: enforces auth for uploads.
- Example UI guards: `src/common/components/layout/Header/HeaderItem.tsx`, `src/features/templates/components/AdminTemplatesPage.tsx`.

## Runtime flow

1. Request enters via Next.js routes

- `src/middleware.ts` runs `clerkMiddleware()` to attach Clerk session/claims.

2. Providers and org sync

- `src/app/layout.tsx` uses `ClerkProvider` and renders `SyncActiveOrganization` with `sessionClaims?.membership` to ensure an active organization is set client-side when missing.

3. Server context for API and RSC

- `src/server/api/trpc.ts` `createTRPCContext` calls `auth()` to read `session` and computes `isAdmin` based on org claims.
- `protectedProcedure` requires `ctx.session.userId`.
- `adminProcedure` requires `ctx.isAdmin`.

4. Webhooks and side effects

- `src/app/api/webhooks/clerk/route.ts` verifies via Svix using `env.CLERK_WEBHOOK_SECRET` and mirrors user changes to the app DB.

5. Uploads and other server routes

- `src/app/api/uploadthing/core.ts` calls `auth()` and rejects when `!userId`.
- Other routes (e.g., Stripe checkout) read `auth()` to associate actions to the user.

## Roles and claims

- Clerk session includes organization claims under `session.sessionClaims.o` with shape `{ id, rol, slg }`.
- `isAdmin` is true if `rol === 'admin'` or `session.has({ role: 'org:admin' })`.
- Use `adminProcedure` for admin-only tRPC endpoints and `Protect role="org:admin"` for admin-only UI.

## Server usage patterns

### tRPC protected procedure (require signed-in user)

```ts
import { protectedProcedure } from "~/server/api/trpc";

export const exampleRouter = {
  getMine: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.userId;
    return ctx.db.resource.findMany({ where: { ownerId: userId } });
  }),
};
```

### tRPC admin-only procedure (require org admin)

```ts
import { adminProcedure } from "~/server/api/trpc";

export const adminRouter = {
  deleteAny: adminProcedure.mutation(async ({ ctx, input }) => {
    return ctx.db.resource.delete({ where: { id: input.id } });
  }),
};
```

### Read auth in a Route Handler

```ts
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  const { userId } = auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  // handle request for userId
  return new Response("ok");
}
```

## Client usage patterns

### UI protection

```tsx
import { Protect } from "@clerk/nextjs";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <Protect role="org:admin">{children}</Protect>;
}
```

### Sign in and sign out (custom hook)

- `src/features/auth/hooks/useAuth.ts` wraps Clerk SDK for OAuth authentication (Google and GitHub) and sign out.
- Components using it: `SigninDialog` for OAuth authentication flows.

## SSO callback

- `src/app/(auth)/sso-callback/page.tsx` renders `AuthenticateWithRedirectCallback` to complete OAuth flows.

## Webhooks

- `src/app/api/webhooks/clerk/route.ts`
  - Verifies `svix-*` headers using `env.CLERK_WEBHOOK_SECRET`.
  - Handles:
    - `user.created`: creates a DB user only for Google OAuth users.
    - `user.updated`: updates email/name.
    - `user.deleted`: deletes DB user by Clerk ID.

## Uploads

- `src/app/api/uploadthing/core.ts` requires `auth().userId`; rejects with `UploadThingError('Unauthorized')` otherwise.

## Environment variables

Defined/validated in `src/env.js`:

- `CLERK_WEBHOOK_SECRET`: required to verify Clerk webhooks.

Common Clerk variables (configure in your deployment env):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk frontend key.
- `CLERK_SECRET_KEY`: Clerk backend key.

Other relevant variables (used elsewhere): Stripe keys/price IDs and `UPLOADTHING_TOKEN`.

## How to add auth to new features

- Server (tRPC):

  - Require sign-in: use `protectedProcedure`.
  - Require admin: use `adminProcedure`.
  - Access user: `ctx.session.userId`.

- Server (Route Handlers/RSC):

  - Call `auth()` from `@clerk/nextjs/server` to get `{ userId, orgId, sessionId, sessionClaims }`.

- Client UI:
  - Wrap admin-only elements with `<Protect role="org:admin">`.

## Reference map (where to look in code)

- Middleware: `src/middleware.ts`
- Providers/layout: `src/app/layout.tsx`
- Org sync: `src/features/auth/components/SyncActiveOrganizations.tsx`
- tRPC context and procedures: `src/server/api/trpc.ts`
- App router tRPC endpoints: `src/app/api/trpc/[trpc]/route.ts`
- RSC tRPC helper: `src/trpc/server.ts`
- UI guards: `src/common/components/layout/Header/HeaderItem.tsx`, `src/features/templates/components/AdminTemplatesPage.tsx`
- Webhooks: `src/app/api/webhooks/clerk/route.ts`
- Upload auth: `src/app/api/uploadthing/core.ts`

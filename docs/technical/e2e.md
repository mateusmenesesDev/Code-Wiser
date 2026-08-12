# End-to-end tests

The P0.4 journey runs with Playwright against a database dedicated to E2E. It uses real Clerk sessions and real application APIs; it does not mock authentication, Prisma, tRPC, or the product flow.

## Required environment

Use a controlled Clerk test instance and two pre-created users:

- `E2E_DATABASE_URL`: database URL reserved for E2E. This variable is mandatory and is never inferred from `DATABASE_URL`.
- `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_ID`: the student test user.
- `E2E_CLERK_ADMIN_EMAIL` / `E2E_CLERK_ADMIN_ID`: the administrator test user. The Clerk user must have the organization role required by the admin-protected page.
- The normal application and Clerk variables, including `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

Optional:

- `E2E_BASE_URL`: an already-running application URL. If omitted, Playwright starts `bun next dev -p 3001` on `http://127.0.0.1:3001` and passes `E2E_DATABASE_URL` to the server as `DATABASE_URL`.
- `E2E_RUN_ID`: a stable run identifier. If omitted, the setup generates one.

The setup creates only prefixed, run-scoped records. It removes those records in global teardown. It does not run migrations, reset the database, or seed unrelated data.

## Commands

```bash
bun run e2e:install
bun run e2e
```

For an existing server:

```bash
E2E_BASE_URL=http://127.0.0.1:3001 bun run e2e
```

Authentication states and Playwright diagnostics are ignored by Git. A failed run retains its trace, screenshot, and video under `playwright/`.

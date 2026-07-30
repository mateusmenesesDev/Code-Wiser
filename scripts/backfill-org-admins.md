# Backfill / sync `User.isOrgAdmin`

Local projection of Clerk `org:admin` used by notification fan-out (`getAdminUsers`).

## Deploy order

1. **Migrate** — apply `20260730210000_add_user_is_org_admin` (`isOrgAdmin` defaults to `false`).
2. **Backfill** — `bun run db:backfill-org-admins` (or `:dry` first).
3. **Deploy app** — code that:
   - reads `where: { isOrgAdmin: true }` in `getAdminUsers`
   - handles Clerk `organizationMembership.created|updated|deleted` webhooks
4. **Clerk Dashboard** — ensure the existing Clerk webhook endpoint includes those three membership events.

Do **not** deploy the new `getAdminUsers` before backfill, or admin notifications will target nobody until the backfill/webhook catches up.

## Repair drift

If admins stop receiving notifications after role changes in Clerk:

```bash
bun run db:backfill-org-admins:dry
bun run db:backfill-org-admins
```

Then verify webhook deliveries for membership events are succeeding.

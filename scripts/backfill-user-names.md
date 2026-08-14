# Backfill `User.name`

Copies names from Clerk into local users whose `name` is missing. Existing names are preserved.

## Commands

```bash
bun run db:backfill-user-names:dry
bun run db:backfill-user-names
```

The commands use the production Infisical environment. Run the dry-run first; the normal command writes the changes.

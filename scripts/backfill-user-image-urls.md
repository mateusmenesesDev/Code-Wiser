# Backfill `User.imageUrl`

Projects Clerk profile image URLs into the local `User` table so admin user lists and avatars do not fan out to Clerk per row.

## Deploy order

1. Apply migration `20260730220000_add_user_image_url`
2. Run `bun run db:backfill-user-images`
3. Deploy app code that reads `imageUrl` and syncs it from `user.created` / `user.updated` webhooks

## Commands

```bash
bun run db:backfill-user-images:dry
bun run db:backfill-user-images
```

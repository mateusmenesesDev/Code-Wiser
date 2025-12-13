# Utility Scripts

This directory contains utility scripts for database maintenance and migrations.

## Available Scripts

### fix-reset-dates.ts

Fixes users with `null` `weeklySessionsResetAt` dates by setting them to the next Monday at midnight UTC.

**When to use:**

- After initial deployment of the mentorship feature
- If users show "N/A" for their reset date
- After manual database changes

**How to run:**

```bash
# Using infisical (recommended for production)
infisical run -- npx tsx scripts/fix-reset-dates.ts

# Or directly (if .env is configured)
npx tsx scripts/fix-reset-dates.ts
```

**What it does:**

1. Finds all users with `mentorshipStatus: 'ACTIVE'` and `weeklySessionsResetAt: null`
2. Sets `weeklySessionsResetAt` to next Monday at 00:00 UTC
3. Resets `remainingWeeklySessions` to their `weeklyMentorshipSessions` value

**Example output:**

```
🔍 Finding users with null weeklySessionsResetAt...
📊 Found 3 users to fix
📅 Setting reset date to: 2025-12-16T00:00:00.000Z

👤 Fixing user: user@example.com (user_123)
   Weekly sessions: 2
   Current remaining: 0
   ✅ Updated!

🎉 Successfully fixed 3 users!
✨ Done!
```

## Creating New Scripts

When creating new utility scripts:

1. Use TypeScript (`.ts` extension)
2. Import from `~/server/db` for database access
3. Add proper error handling
4. Include helpful console output
5. Document the script in this README
6. Use `npx tsx` to run TypeScript directly

Example template:

```typescript
import { db } from "../src/server/db";

async function myScript() {
  console.log("🔍 Starting...");

  try {
    // Your logic here
    console.log("✅ Success!");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

myScript()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

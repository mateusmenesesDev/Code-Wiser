## Environment Configuration

This document outlines the environment variable setup for the mentorship system, including validation, configuration patterns, and deployment considerations.

### Libraries & Validation

- **@t3-oss/env-nextjs**: Type-safe environment validation with Zod schemas
- **dotenv**: Manual loading for Prisma configuration
- **Zod**: Runtime validation and type inference for all environment variables

### Environment Schema

The application uses a centralized environment configuration in `src/env.js` with strict validation:

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    /* server-only variables */
  },
  client: {
    /* client-exposed variables */
  },
  runtimeEnv: {
    /* process.env mapping */
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
```

### Required Environment Variables

#### Database Configuration

- **DATABASE_URL**: CockroachDB connection string (validated as URL)
  - Format: `postgresql://user:password@host:port/database?options`
  - Used by Prisma for database connections

#### Authentication (Clerk)

- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Clerk frontend/public key
- **CLERK_SECRET_KEY**: Clerk backend API key
- **CLERK_WEBHOOK_SECRET**: Secret for verifying Clerk webhook signatures
  - Used in `src/app/api/webhooks/clerk/route.ts` for user sync operations

#### Payment Processing (Stripe)

- **STRIPE_SECRET_KEY**: Stripe API secret key
- **STRIPE_CREDITS_500_PRICE_ID**: Price ID for 500 credits package
- **STRIPE_CREDITS_1500_PRICE_ID**: Price ID for 1500 credits package
- **STRIPE_CREDITS_3000_PRICE_ID**: Price ID for 3000 credits package
- **STRIPE_WEBHOOK_SECRET**: Secret for verifying Stripe webhook signatures

#### File Uploads

- **UPLOADTHING_TOKEN**: Authentication token for UploadThing service
  - Used in `src/app/api/uploadthing/core.ts` for file upload handling

#### Runtime Environment

- **NODE_ENV**: Application environment (`development` | `test` | `production`)
  - Defaults to `development` if not specified
  - Controls logging levels and development features

### Optional Environment Variables

#### Build & Deployment

- **SKIP_ENV_VALIDATION**: Skip environment validation (useful for Docker builds)
- **ENVIRONMENT**: Custom environment identifier
- **VERCEL_ENV**: Vercel deployment environment
- **RAILWAY_ENVIRONMENT**: Railway deployment environment

### Environment Safety & Protection

The application includes comprehensive environment detection for database operations:

```ts
// Used in seed scripts and database operations
function checkEnvironment() {
  const isProd =
    nodeEnv === "production" ||
    environment === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.RAILWAY_ENVIRONMENT === "production";

  if (isProd) {
    // Prevents destructive operations in production
    process.exit(1);
  }
}
```

**Safety Features:**

- Database reset scripts cannot run in production environments
- Multiple environment variable checks (NODE_ENV, ENVIRONMENT, VERCEL_ENV, RAILWAY_ENVIRONMENT)
- Centralized environment checking utility at `prisma/seed/utils/environment.ts`

### Configuration Patterns

#### Type-Safe Access

```ts
import { env } from "~/env";

// Validated and typed environment variables
const dbUrl = env.DATABASE_URL;
const isProduction = env.NODE_ENV === "production";
```

#### Client vs Server Variables

- **Server variables**: Validated on server-side only, not exposed to browser
- **Client variables**: Must be prefixed with `NEXT_PUBLIC_` to be exposed
- **Runtime mapping**: Required for Next.js edge runtime compatibility

#### Validation Features

- **URL validation**: DATABASE_URL must be a valid URL
- **Enum validation**: NODE_ENV restricted to specific values
- **Empty string handling**: Empty strings treated as undefined
- **Required validation**: All variables must be present (no optional server vars)

### Development Setup

#### Local Environment File

Create `.env.local` or `.env` with:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mentorship_dev"

# Environment
NODE_ENV="development"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_CREDITS_500_PRICE_ID="price_..."
STRIPE_CREDITS_1500_PRICE_ID="price_..."
STRIPE_CREDITS_3000_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# File Uploads
UPLOADTHING_TOKEN="sk_live_..."
```

#### Prisma Configuration

The application uses manual dotenv loading for Prisma operations:

```ts
// prisma.config.ts
import * as dotenv from "dotenv";
dotenv.config(); // Manual loading for Prisma CLI
```

### Deployment Considerations

#### Production Checklist

- ✅ All required environment variables set
- ✅ Production database URL configured
- ✅ Clerk keys for production app
- ✅ Stripe live keys and webhook secrets
- ✅ NODE_ENV set to 'production'
- ✅ Webhook endpoints configured in external services

#### Platform-Specific Notes

- **Vercel**: Environment variables auto-detected via VERCEL_ENV
- **Railway**: Environment variables auto-detected via RAILWAY_ENVIRONMENT
- **Docker**: Use SKIP_ENV_VALIDATION=1 for build optimization
- **Local Development**: Use .env.local to override defaults

### Database Scripts & Environment

Database management scripts include automatic environment protection:

```bash
# Safe to run in development
npm run db:reset
npm run db:seed
npm run db:reset-advanced

# Will exit with error in production
# Environment check prevents data loss
```

### Error Handling

The application provides clear error messages for missing or invalid environment variables:

- **Build time**: Invalid variables prevent application compilation
- **Runtime**: Missing variables throw descriptive errors
- **Webhook verification**: Failed verification returns 400 status codes
- **Database operations**: Production environment detection prevents destructive operations

### Best Practices

1. **Never commit sensitive values**: Use .env.local for local development
2. **Validate early**: Environment validation runs at import time
3. **Use type safety**: Import from `~/env` for validated access
4. **Platform detection**: Leverage automatic environment detection
5. **Webhook security**: Always verify webhook signatures
6. **Development safety**: Use environment checks for destructive operations

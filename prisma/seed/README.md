# Database Seeding & Reset Scripts

This directory contains scripts for managing test data in your mentorship system database.

## Available Scripts

### 🌱 **Seeding Scripts**

#### `npm run db:test-data`

Creates comprehensive test data with 50+ realistic project templates using Faker.js.

**What it creates:**

- 15 Categories (Web Development, Mobile Development, Data Science, etc.)
- 59 Technologies (React, Vue.js, Python, Docker, etc.)
- 55+ Project Templates with dynamic content
- ~440 Tasks (8 per template on average)

**Features:**

- Dynamic project titles using Faker.js business terms
- Realistic descriptions with technical jargon
- Varied task priorities, types, and tags
- Technology stacks matched to categories
- Random prerequisites and durations

### 🗑️ **Reset Scripts**

#### `npm run db:reset`

**Simple reset** - Clears ALL data from the database.

```bash
npm run db:reset
```

#### `npm run db:reset-advanced`

**Advanced reset** with selective preservation options.

```bash
# Show help
npm run db:reset-advanced -- --help

# Reset everything with confirmation
npm run db:reset-advanced -- --confirm

# Preserve categories and technologies
npm run db:reset-advanced -- --preserve-categories --preserve-technologies --confirm

# Preserve users (for production-like environments)
npm run db:reset-advanced -- --preserve-users --confirm
```

**Options:**

- `--preserve-categories` - Keep existing categories
- `--preserve-technologies` - Keep existing technologies
- `--preserve-users` - Keep user data (requires auth integration)
- `--confirm` - Skip confirmation prompt
- `--help` - Show usage information

### 🔄 **Combined Scripts**

#### `npm run db:reset-and-seed`

Resets the database completely and then seeds it with fresh test data.

```bash
npm run db:reset-and-seed
```

## Usage Examples

### Development Workflow

```bash
# Start fresh with new test data
npm run db:reset-and-seed

# Add more test data without clearing existing
npm run db:test-data

# Reset but keep base data (categories/technologies)
npm run db:reset-advanced -- --preserve-categories --preserve-technologies --confirm
npm run db:test-data
```

### Production-like Testing

```bash
# Reset while preserving user accounts
npm run db:reset-advanced -- --preserve-users --confirm
npm run db:test-data
```

## File Structure

```
prisma/seed/
├── README.md                    # This documentation
├── create-test-data.ts          # Main seeding script with Faker.js
├── reset-database.ts            # Simple reset script
├── reset-database-advanced.ts   # Advanced reset with options
└── utils/
    └── environment.ts           # Shared environment safety check utility
```

## Faker.js Integration

The seeding script uses various Faker.js methods for realistic data:

- **`faker.company.buzzAdjective()`** → "Revolutionary", "Cutting-edge"
- **`faker.hacker.adjective()`** → "digital", "neural", "virtual"
- **`faker.hacker.noun()`** → "protocol", "system", "interface"
- **`faker.word.adjective()`** → "auxiliary", "seamless", "innovative"
- **`faker.helpers.arrayElement()`** → Random selection from arrays
- **`faker.number.int()`** → Random numbers with ranges

This creates varied and realistic project templates, tasks, and descriptions that change with each run.

## Safety Notes

### 🛡️ **Production Environment Protection**

All scripts include **automatic environment detection** to prevent accidental execution in production:

- **Blocked environments**: `NODE_ENV=production`, `ENVIRONMENT=production`, `VERCEL_ENV=production`, `RAILWAY_ENVIRONMENT=production`
- **Safe environments**: `development`, `test`, `local`, or undefined
- **Override**: Not possible - scripts will always exit in production environments

```bash
# ❌ This will be blocked
NODE_ENV=production npm run db:reset

# ✅ This will work
NODE_ENV=development npm run db:reset
```

### ⚠️ **General Safety**

- **Warning**: Reset scripts permanently delete data. Always backup important data before running reset scripts.
- **Safe for development**: These scripts are designed for development and testing environments.
- **Production considerations**: Use `--preserve-users` option in production-like environments to maintain user accounts.

### 🔍 **Environment Detection**

The scripts check for these environment variables:

- `NODE_ENV` (most common)
- `ENVIRONMENT` (custom environments)
- `VERCEL_ENV` (Vercel deployments)
- `RAILWAY_ENVIRONMENT` (Railway deployments)

If any of these are set to `production` or `prod`, the script will immediately exit with an error message showing all detected environment variables.

**DRY Principle**: Environment checking logic is centralized in `utils/environment.ts` to avoid code duplication across all seed scripts.

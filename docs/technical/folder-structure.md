## Folder Structure

This document outlines the complete folder structure and organizational conventions for the mentorship system, built with the T3 Stack (Next.js, tRPC, Prisma, TailwindCSS).

### Project Root

```
mentorship-system/
├── src/                    # Source code (main application)
├── prisma/                 # Database schema and seeding
├── docs/                   # Project documentation
├── public/                 # Static assets
├── Configuration files...
```

### Configuration Files

```
├── biome.json              # Biome linter and formatter config
├── components.json         # shadcn/ui components configuration
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.cjs      # PostCSS configuration
├── prisma.config.ts        # Prisma configuration with dotenv
├── tailwind.config.ts      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest testing configuration
├── start-database.sh       # Local database startup script
└── README.md               # Project overview
```

### Source Code Structure (`src/`)

The source code follows a **feature-based architecture** with clear separation of concerns:

```
src/
├── app/                    # Next.js App Router (routes & layouts)
├── features/              # Business logic modules (domain-driven)
├── common/                # Shared utilities and components
├── server/                # Backend API and database layer
├── lib/                   # External library configurations
├── providers/             # React context providers
├── services/              # External service integrations
├── styles/               # Global styles
├── trpc/                 # tRPC client configuration
├── types/                # Global TypeScript types
├── env.js                # Environment validation
└── middleware.ts         # Next.js middleware (authentication)
```

### App Router Structure (`src/app/`)

Next.js App Router with **route groups** for organization:

```
app/
├── layout.tsx                    # Root layout (providers, metadata)
├── (auth)/                      # Authentication routes group
│   └── sso-callback/
│       └── page.tsx             # OAuth callback handler
├── (system)/                    # Main application routes group
│   ├── layout.tsx               # System layout (header, navigation)
│   ├── page.tsx                 # Home/catalog page
│   ├── admin/
│   │   └── templates/           # Admin template management
│   │       ├── page.tsx         # Template list
│   │       └── [id]/
│   │           ├── page.tsx     # Template detail
│   │           └── edit/
│   │               └── page.tsx # Template editor
│   ├── my-projects/
│   │   └── page.tsx             # User's enrolled projects
│   ├── project/
│   │   └── [id]/
│   │       └── page.tsx         # Project detail/enrollment
│   ├── workspace/
│   │   └── [id]/
│   │       └── page.tsx         # Project workspace (Kanban/Backlog)
│   ├── pricing/
│   │   └── page.tsx             # Credit packages
│   ├── success/
│   │   └── page.tsx             # Payment success
│   └── canceled/
│       └── page.tsx             # Payment canceled
└── api/                         # API routes
    ├── trpc/
    │   └── [trpc]/
    │       └── route.ts         # tRPC handler
    ├── uploadthing/
    │   ├── core.ts              # Upload configurations
    │   └── route.ts             # Upload handler
    ├── checkout_sessions/
    │   └── route.ts             # Stripe checkout
    └── webhooks/
        ├── clerk/
        │   └── route.ts         # Clerk webhook handler
        └── stripe/
            └── route.ts         # Stripe webhook handler
```

**Route Group Conventions:**

- `(auth)`: Authentication-related pages (login, signup, callbacks)
- `(system)`: Main application pages requiring authentication
- `api/`: Backend API endpoints and integrations

### Features Architecture (`src/features/`)

**Domain-driven feature modules** with consistent internal structure:

```
features/
├── auth/                        # Authentication & authorization
│   ├── components/              # Auth UI components (Signin, Signup, ForgotPassword)
│   ├── hooks/                   # Authentication logic
│   └── authErrors.ts            # Error handling
├── projects/                    # Project catalog & management
│   ├── components/              # Project UI components
│   ├── hooks/                   # Project-related hooks
│   ├── schemas/                 # Validation schemas
│   ├── types/                   # TypeScript types
│   └── utils/                   # Project utilities
├── templates/                   # Project template management (admin)
│   ├── components/              # Template management UI
│   ├── hook/                    # Template-related hooks
│   ├── schemas/                 # Template validation schemas
│   ├── types/                   # Template TypeScript types
│   └── utils/                   # Template utilities
├── workspace/                   # Project workspace (Kanban/Backlog)
│   ├── atoms/                   # Jotai state atoms
│   ├── components/              # Workspace UI (board/, backlog/, tasks/)
│   ├── hooks/                   # Workspace-related hooks
│   ├── schemas/                 # Task and comment schemas
│   ├── types/                   # Workspace TypeScript types
│   └── utils/                   # Workspace utilities
├── task/                        # Task management
│   └── components/              # Task UI components
├── epics/                       # Epic management
│   ├── components/              # Epic UI components
│   ├── hooks/                   # Epic-related hooks
│   ├── schemas/                 # Epic validation schemas
│   └── types/                   # Epic TypeScript types
├── sprints/                     # Sprint management
│   ├── components/              # Sprint UI components
│   ├── hooks/                   # Sprint-related hooks
│   ├── schemas/                 # Sprint validation schemas
│   └── types/                   # Sprint TypeScript types
├── checkout/                    # Payment & credits
│   ├── constants/               # Stripe product definitions
│   ├── schemas/                 # Checkout validation schemas
│   └── types/                   # Checkout TypeScript types
├── dashboard/                   # Dashboard components
│   ├── components/              # Dashboard UI components
│   ├── constants/               # Dashboard constants
│   ├── mocks/                   # Mock data for development
│   └── Dashboard.tsx            # Main dashboard component
└── schemas/                     # Shared validation schemas
    ├── auth.schema.ts
    └── utils.ts
```

**Feature Module Convention:**
Each feature follows a consistent structure:

- `components/` - React components for the feature
- `hooks/` - Custom React hooks for business logic
- `schemas/` - Zod validation schemas
- `types/` - TypeScript type definitions
- `utils/` - Pure utility functions
- `atoms/` - Jotai state management (when needed)
- `constants/` - Static data and configurations

### Common Layer (`src/common/`)

**Shared utilities and reusable components:**

```
common/
├── atoms/                       # Global state management (Jotai)
├── components/
│   ├── ui/                      # shadcn/ui base components (30+ reusable components)
│   ├── layout/                  # Application layout components
│   ├── icons/                   # Brand and custom icons
│   ├── RichText.tsx             # TipTap rich text editor
│   ├── ErrorMessage.tsx         # Error display component
│   ├── ConfirmationDialog.tsx   # Confirmation dialogs
│   └── ToggleTheme.tsx          # Theme switcher
├── hooks/                       # Shared React hooks
├── utils/                       # Pure utility functions
└── constants/                   # Shared constants and configurations
```

### Server Layer (`src/server/`)

**Backend API and database access layer:**

```
server/
├── api/
│   ├── root.ts                  # Main tRPC router aggregation
│   ├── trpc.ts                  # tRPC setup, context, procedures
│   └── routers/                 # Feature-specific API routers
│       ├── user/
│       │   ├── index.ts         # User router export
│       │   ├── actions.ts       # User actions
│       │   ├── queries.ts       # User queries
│       │   └── user.ts          # User router definition
│       ├── project/
│       │   ├── index.ts
│       │   ├── project.ts
│       │   ├── mutations/
│       │   │   └── projectMutations.ts
│       │   ├── queries/
│       │   │   └── getProjectQueries.ts
│       │   └── utils/
│       │       └── userHasAccess.ts
│       ├── template/
│       │   ├── index.ts
│       │   ├── projectTemplate.ts
│       │   ├── actions/
│       │   │   └── projectTemplateActions.ts
│       │   ├── mutations/
│       │   │   └── projectTemplateMutations.ts
│       │   ├── queries/
│       │   │   ├── getProjectTemplateQueries.ts
│       │   │   ├── project/
│       │   │   │   └── projectTemplateQueries.ts
│       │   │   └── sprint/
│       │   │       └── sprintTemplate.query.ts
│       │   ├── tests/
│       │   │   └── project.test.ts
│       │   └── utils/
│       ├── task/
│       │   ├── taskRouter.ts
│       │   ├── mutations/
│       │   │   └── taskMutations.ts
│       │   └── queries/
│       │       └── task.queries.ts
│       ├── sprint/
│       │   ├── sprint.router.ts
│       │   ├── mutations/
│       │   │   └── sprint.mutation.ts
│       │   └── queries/
│       │       └── sprint.query.ts
│       ├── epic/
│       │   ├── epic.router.ts
│       │   ├── mutations/
│       │   │   └── epic.mutation.ts
│       │   └── queries/
│       │       └── epic.query.ts
│       └── comment/
│           ├── index.ts
│           ├── mutations/
│           │   └── comment.mutation.ts
│           ├── queries/
│           │   └── getCommentsByTaskId.ts
│           └── utils/
│               └── comment.utils.ts
├── db.ts                        # Prisma client setup
├── utils/                       # Server-side utilities
│   ├── categoryUtils.ts
│   ├── projectUtils.ts
│   └── technologyUtils.ts
└── __mocks__/
    └── db.ts                    # Database mocking for tests
```

**tRPC Router Convention:**

- Each domain has its own router in `routers/[domain]/`
- `mutations/` - Data modification operations
- `queries/` - Data fetching operations
- `utils/` - Domain-specific server utilities
- `actions/` - Complex business logic
- `tests/` - Unit tests for the router

### Database Layer (`prisma/`)

**Database schema and seeding system:**

```
prisma/
├── schema.prisma               # Main Prisma schema file
├── models/                     # Modular schema organization
│   ├── enums.prisma           # Shared enums
│   ├── user.prisma            # User and auth models
│   ├── project.prisma         # Project model
│   ├── projectTemplate.prisma # Project template model
│   ├── projectManagement.prisma # Task, Epic, Sprint models
│   └── projectBase.prisma     # Base project entities
└── seed/                      # Database seeding system
    ├── main.ts                # Main seeding entry point
    ├── orchestrator.ts        # Seeding orchestration
    ├── reset-database.ts      # Database reset utility
    ├── reset-database-advanced.ts # Advanced reset with options
    ├── README.md              # Seeding documentation
    ├── data/                  # Static seed data
    │   ├── categories.ts
    │   ├── technologies.ts
    │   ├── projectTemplates.ts
    │   ├── epics.ts
    │   ├── sprints.ts
    │   └── tasks.ts
    ├── generators/            # Dynamic data generators
    │   ├── templateGenerator.ts
    │   ├── projectTitleGenerator.ts
    │   ├── categoryGenerator.ts
    │   ├── technologyGenerator.ts
    │   ├── epicGenerator.ts
    │   ├── sprintGenerator.ts
    │   ├── taskGenerator.ts
    │   └── titleGenerator.ts
    └── utils/                 # Seeding utilities
        ├── environment.ts     # Environment safety checks
        └── logger.ts          # Logging utilities
```

### Documentation (`docs/`)

**Comprehensive project documentation:**

```
docs/
├── business/                   # Business logic documentation
│   ├── projects.md            # Project system overview
│   ├── pricing.md             # Pricing and credits
│   └── review-requests.md     # Review process
├── technical/                 # Technical documentation
│   ├── authentication.md     # Auth system documentation
│   ├── design.md             # System design overview
│   ├── env.md                # Environment configuration
│   ├── folder-structure.md   # This document
│   ├── forms.md              # Form patterns and validation
│   └── query.md              # Data fetching patterns
├── current-features.md        # Feature status
└── planned-features.md        # Roadmap
```

### Supporting Files

**Additional configuration and assets:**

```
├── public/                    # Static assets
│   ├── codeWise.svg          # Brand logo
│   ├── favicon.svg           # Favicon
│   └── placeholder.svg       # Placeholder images
├── lib/
│   └── utils.ts              # Utility functions (cn, etc.)
├── providers/
│   └── ThemeProvider.tsx     # Theme context provider
├── services/
│   └── stripe.ts             # Stripe service integration
├── styles/
│   └── globals.css           # Global CSS styles
├── trpc/                     # tRPC client configuration
│   ├── query-client.ts       # React Query client config
│   ├── react.tsx             # Client-side tRPC setup
│   └── server.ts             # Server-side tRPC caller
└── types/
    └── globals.d.ts          # Global TypeScript declarations
```

### Architectural Patterns

#### 1. Feature-Based Organization

- **Domain-driven**: Each feature represents a business domain
- **Self-contained**: Features include all related logic (UI, hooks, types, schemas)
- **Consistent structure**: All features follow the same organizational pattern

#### 2. Separation of Concerns

- **Presentation**: Components and UI logic in `components/`
- **Business Logic**: Custom hooks in `hooks/`
- **Data Layer**: tRPC routers in `server/api/routers/`
- **Validation**: Zod schemas in `schemas/`
- **Types**: TypeScript definitions in `types/`

#### 3. Code Reusability

- **Common Layer**: Shared utilities and components in `src/common/`
- **UI Components**: Reusable UI primitives in `src/common/components/ui/`
- **Utility Functions**: Pure functions in `utils/` directories

#### 4. Configuration Management

- **Environment**: Type-safe env validation in `src/env.js`
- **Schema Modularization**: Split Prisma models for maintainability
- **Tool Configuration**: Centralized config files at root level

#### 5. Testing Strategy

- **Unit Tests**: Colocated with routers in `tests/` directories
- **Mocking**: Database mocks in `server/__mocks__/`
- **Test Configuration**: Vitest configuration in `vitest.config.ts`

### Naming Conventions

#### Files and Directories

- **PascalCase**: React components (`ProjectCard.tsx`)
- **camelCase**: Utilities and hooks (`useProject.ts`, `projectUtils.ts`)
- **kebab-case**: Pages and API routes (`my-projects/`, `checkout-sessions/`)
- **lowercase**: Configuration files (`package.json`, `tsconfig.json`)

#### Code Organization

- **Feature Modules**: Singular noun (`project/`, `task/`, `epic/`)
- **Component Groups**: Descriptive folder names (`components/`, `hooks/`, `utils/`)
- **Schema Files**: Domain + `.schema.ts` (`auth.schema.ts`)
- **Type Files**: Domain + `.type.ts` (`Projects.type.ts`)

This folder structure enables **scalable development**, **clear separation of concerns**, and **easy navigation** while following **modern React and Next.js best practices**.

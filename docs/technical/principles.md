## Development Principles

This document outlines the core development principles, coding standards, and architectural decisions that guide the mentorship system's development. These principles ensure consistency, maintainability, and scalability across the codebase.

### Code Organization Principles

#### 1. Single Responsibility Principle

**Guideline**: Each module, function, and component should have one clear purpose.

**Examples**:

- Feature modules contain only related functionality (`src/features/projects/`)
- Utility functions perform single operations (`src/common/utils/`)
- Components handle specific UI concerns (`src/common/components/ui/`)

**Implementation**:

```ts
// ✅ Good: Single purpose utility
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// ❌ Avoid: Multi-purpose function
export const processData = (data: any) => {
  // Validates, transforms, and saves data
  // Too many responsibilities
};
```

#### 2. DRY (Don't Repeat Yourself)

**Guideline**: Avoid code duplication by extracting common patterns into reusable utilities.

**Examples**:

- Shared validation schemas in `src/features/schemas/`
- Common UI components in `src/common/components/ui/`
- Utility functions in `src/common/utils/`

**Implementation**:

```ts
// ✅ Good: Reusable schema building blocks
export const baseUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export const createUserSchema = baseUserSchema.omit({ id: true });
export const updateUserSchema = baseUserSchema.partial().required({ id: true });

// ❌ Avoid: Duplicated validation logic
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
const updateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  id: z.string(),
});
```

#### 3. Feature-Based Architecture

**Guideline**: Organize code by business domains rather than technical layers.

**Structure**:

```
src/features/
├── projects/          # Project-related functionality
├── templates/         # Template management
├── workspace/         # Workspace and task management
├── auth/             # Authentication and authorization
└── checkout/         # Payment and credit system
```

**Benefits**:

- Clear ownership and boundaries
- Easier to locate related code
- Reduced coupling between features
- Simplified testing and maintenance

### Type Safety Principles

#### 1. Strict TypeScript Configuration

**Guideline**: Leverage TypeScript's type system to catch errors at compile time.

**Configuration** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### 2. Schema-First Validation

**Guideline**: Define data shapes with Zod schemas for runtime validation and type inference.

**Implementation**:

```ts
// ✅ Good: Schema defines both validation and types
export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

export type Project = z.infer<typeof projectSchema>;

// Usage ensures type safety and validation
const project: Project = projectSchema.parse(rawData);
```

#### 3. tRPC Type Safety

**Guideline**: Use tRPC procedures to ensure end-to-end type safety between client and server.

**Implementation**:

```ts
// Server: Define procedure with input/output types
export const createProject = protectedProcedure
  .input(createProjectSchema)
  .output(projectSchema)
  .mutation(async ({ ctx, input }) => {
    // Implementation
  });

// Client: Fully typed usage
const { mutate } = api.project.createProject.useMutation();
// input and output types are automatically inferred
```

### State Management Principles

#### 1. Server State vs Client State

**Guideline**: Clearly separate server state (from API) from client state (UI interactions).

**Server State**:

- Managed by React Query via tRPC
- Cached and synchronized with server
- Handles loading, error, and success states

**Client State**:

- Managed by React state or Jotai atoms
- UI-specific interactions (form state, dialogs, filters)
- Temporary and ephemeral

**Implementation**:

```ts
// ✅ Server state (React Query)
const { data: projects, isLoading } = api.project.getEnrolled.useQuery();

// ✅ Client state (React state)
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [filters, setFilters] = useState({ category: "all" });

// ✅ Derived state (useMemo)
const filteredProjects = useMemo(() => {
  return projects?.filter(
    (p) => filters.category === "all" || p.category === filters.category
  );
}, [projects, filters.category]);
```

#### 2. Optimistic Updates

**Guideline**: Provide immediate UI feedback for user actions while handling server synchronization.

**Implementation**:

```ts
const updateTask = api.task.updateTask.useMutation({
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await utils.task.getByProjectId.cancel({ projectId });

    // Snapshot previous value
    const previous = utils.task.getByProjectId.getData({ projectId });

    // Optimistically update
    utils.task.getByProjectId.setData({ projectId }, (old) =>
      old?.map((t) => (t.id === newTask.id ? { ...t, ...newTask } : t))
    );

    return { previous };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    if (context?.previous) {
      utils.task.getByProjectId.setData({ projectId }, context.previous);
    }
  },
  onSettled: () => {
    // Refetch to ensure consistency
    utils.task.getByProjectId.invalidate({ projectId });
  },
});
```

### Error Handling Principles

#### 1. Graceful Degradation

**Guideline**: Handle errors gracefully to maintain user experience.

**Implementation**:

```ts
// ✅ Good: Error boundaries and fallbacks
function ProjectList() {
  const {
    data: projects,
    error,
    isLoading,
  } = api.project.getEnrolled.useQuery();

  if (isLoading) return <ProjectListSkeleton />;
  if (error) return <ErrorMessage message="Failed to load projects" />;
  if (!projects?.length) return <EmptyState />;

  return <ProjectGrid projects={projects} />;
}
```

#### 2. User-Friendly Error Messages

**Guideline**: Provide clear, actionable error messages to users.

**Implementation**:

```ts
// ✅ Good: Descriptive error messages
export const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

// ✅ Good: Contextual error handling
const createProject = api.project.createProject.useMutation({
  onError: (error) => {
    if (error.data?.code === "UNAUTHORIZED") {
      toast.error("Please sign in to create projects");
    } else if (error.data?.code === "INSUFFICIENT_CREDITS") {
      toast.error("Insufficient credits. Please purchase more credits.");
    } else {
      toast.error("Failed to create project. Please try again.");
    }
  },
});
```

### Performance Principles

#### 1. Code Splitting and Lazy Loading

**Guideline**: Load code only when needed to improve initial bundle size.

**Implementation**:

```ts
// ✅ Good: Lazy load heavy components
const RichTextEditor = lazy(() => import("~/common/components/RichText"));

function TaskDialog() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <RichTextEditor />
    </Suspense>
  );
}
```

#### 2. Memoization Strategy

**Guideline**: Use memoization judiciously to prevent unnecessary re-renders.

**Implementation**:

```ts
// ✅ Good: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return projects?.reduce((acc, project) => {
    // Complex calculation
    return acc + project.complexity * project.duration;
  }, 0);
}, [projects]);

// ✅ Good: Memoize callback functions
const handleProjectSelect = useCallback(
  (projectId: string) => {
    router.push(`/workspace/${projectId}`);
  },
  [router]
);

// ❌ Avoid: Unnecessary memoization
const simpleValue = useMemo(() => projects?.length ?? 0, [projects]);
// Just use: const simpleValue = projects?.length ?? 0;
```

#### 3. Query Optimization

**Guideline**: Optimize data fetching to minimize network requests and improve user experience.

**Implementation**:

```ts
// ✅ Good: Appropriate stale times
const { data } = api.projectTemplate.getApproved.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// ✅ Good: Disable unnecessary refetches
const { data } = api.user.getProfile.useQuery(undefined, {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// ✅ Good: Parallel queries for related data
const [projects, user] = await Promise.all([
  api.project.getEnrolled.query(),
  api.user.getProfile.query(),
]);
```

### Security Principles

#### 1. Input Validation

**Guideline**: Validate all inputs at the boundary (API endpoints) using Zod schemas.

**Implementation**:

```ts
// ✅ Good: Validate input with schema
export const createProject = protectedProcedure
  .input(createProjectSchema) // Validates input
  .mutation(async ({ ctx, input }) => {
    // input is guaranteed to be valid
    return ctx.db.project.create({ data: input });
  });
```

#### 2. Authorization Checks

**Guideline**: Always verify user permissions before performing operations.

**Implementation**:

```ts
// ✅ Good: Check permissions in procedures
export const deleteProject = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const project = await ctx.db.project.findUnique({
      where: { id: input.id },
      include: { members: true },
    });

    if (!project) throw new TRPCError({ code: "NOT_FOUND" });
    if (!project.members.some((m) => m.id === ctx.session.userId)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return ctx.db.project.delete({ where: { id: input.id } });
  });
```

#### 3. Environment Safety

**Guideline**: Protect against destructive operations in production environments.

**Implementation**:

```ts
// ✅ Good: Environment checks for destructive operations
export function checkEnvironment() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  if (isProd) {
    console.error("Cannot run destructive operations in production");
    process.exit(1);
  }
}

// Usage in seed scripts
if (require.main === module) {
  checkEnvironment();
  // Proceed with database reset
}
```

### Testing Principles

#### 1. Test Organization

**Guideline**: Co-locate tests with the code they test and follow the same structure.

**Structure**:

```
src/features/projects/
├── components/
│   ├── ProjectCard.tsx
│   └── ProjectCard.test.tsx
├── hooks/
│   ├── useProject.ts
│   └── useProject.test.ts
└── utils/
    ├── projectUtils.ts
    └── projectUtils.test.ts
```

#### 2. Testing Strategy

**Guideline**: Focus on testing behavior and user interactions rather than implementation details.

**Implementation**:

```ts
// ✅ Good: Test user behavior
test("user can create a project", async () => {
  render(<CreateProjectDialog />);

  await user.type(screen.getByLabelText("Title"), "My Project");
  await user.click(screen.getByRole("button", { name: "Create" }));

  expect(screen.getByText("Project created successfully")).toBeInTheDocument();
});

// ❌ Avoid: Testing implementation details
test("calls createProject mutation", () => {
  const mockMutate = jest.fn();
  // Testing internal implementation
});
```

### Documentation Principles

#### 1. Self-Documenting Code

**Guideline**: Write code that is clear and readable without extensive comments.

**Implementation**:

```ts
// ✅ Good: Clear function and variable names
const calculateProjectProgress = (tasks: Task[]): number => {
  const completedTasks = tasks.filter((task) => task.status === "DONE");
  return (completedTasks.length / tasks.length) * 100;
};

// ❌ Avoid: Unclear names requiring comments
const calc = (t: Task[]): number => {
  const done = t.filter((x) => x.s === "DONE");
  return (done.length / t.length) * 100;
};
```

#### 2. API Documentation

**Guideline**: Document complex APIs and business logic with clear examples.

**Implementation**:

````ts
/**
 * Creates a new project from a template with all associated entities.
 *
 * @param templateId - The ID of the template to instantiate
 * @param userId - The ID of the user creating the project
 *
 * @example
 * ```ts
 * const project = await createProjectFromTemplate({
 *   templateId: 'template-123',
 *   userId: 'user-456'
 * });
 * ```
 */
export async function createProjectFromTemplate({
  templateId,
  userId,
}: CreateProjectParams): Promise<Project> {
  // Implementation
}
````

### Accessibility Principles

#### 1. Semantic HTML

**Guideline**: Use appropriate HTML elements for their intended purpose.

**Implementation**:

```tsx
// ✅ Good: Semantic HTML
function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card">
      <header>
        <h2>{project.title}</h2>
        <p>{project.description}</p>
      </header>
      <footer>
        <button aria-label={`Start ${project.title} project`}>
          Start Project
        </button>
      </footer>
    </article>
  );
}

// ❌ Avoid: Non-semantic structure
function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="project-card">
      <div>
        <div>{project.title}</div>
        <div>{project.description}</div>
      </div>
      <div>
        <div>Start Project</div>
      </div>
    </div>
  );
}
```

#### 2. Keyboard Navigation

**Guideline**: Ensure all interactive elements are keyboard accessible.

**Implementation**:

```tsx
// ✅ Good: Keyboard accessible
function ProjectDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project Details</DialogTitle>
        </DialogHeader>
        {/* Content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Related Files

#### Core Infrastructure

- `src/env.js` - Environment validation and type safety
- `src/server/api/trpc.ts` - tRPC setup and procedure definitions
- `src/common/components/ui/` - Reusable UI components

#### Validation and Schemas

- `src/features/schemas/` - Zod validation schemas
- `src/features/*/schemas/` - Feature-specific validation

#### Testing

- `vitest.config.ts` - Test configuration
- `src/server/__mocks__/` - Test utilities and mocks

#### Documentation

- `docs/technical/` - Technical documentation
- `docs/business/` - Business logic documentation
- `README.md` - Project overview and setup

These principles guide all development decisions and ensure the codebase remains maintainable, scalable, and user-friendly as it grows.

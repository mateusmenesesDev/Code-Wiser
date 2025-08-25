## Projects System

This document outlines the complete project lifecycle in the mentorship system, covering both business logic and technical implementation for project templates, enrollment, workspace management, and the credit-based access model.

### Overview

The project system is the core feature that enables users to discover, enroll in, and work through structured development projects. It operates on a template-based model where admins create reusable project templates that users can instantiate as their personal projects.

**Key Concepts:**

- **Project Templates**: Admin-created blueprints with predefined tasks, sprints, and epics
- **Projects**: User-specific instances created from templates
- **Workspace**: Task management environment for active projects
- **Access Control**: Three-tier system (Free, Credits, Mentorship)
- **Credit System**: Virtual currency for accessing premium content

### Business Model

#### Access Types

**1. Free Projects**

- No cost to users
- Open access for skill building
- Basic project templates
- Community support only

**2. Credit-Based Projects**

- Users purchase credits via Stripe checkout
- Premium templates with advanced features
- Structured learning paths
- Enhanced project complexity

**3. Mentorship Projects**

- Included with active mentorship subscriptions
- Unlimited access to all templates
- Direct mentor guidance
- Priority support and reviews

#### Credit System Economics

**Credit Packages** (defined in Stripe):

- 500 credits package
- 1500 credits package
- 3000 credits package

**Project Costs** (varies by complexity):

- Beginner projects: 100-300 credits
- Intermediate projects: 400-800 credits
- Advanced projects: 900+ credits

**Mentorship Bypass**: Active mentees have unlimited access regardless of credits.

### Project Discovery Flow

#### 1. Public Catalog

**Location**: Home page (`src/app/(system)/page.tsx`)
**Features**:

- Browse approved project templates
- Search by keywords, technologies, categories
- Filter by difficulty, access type, category
- View project cards with metadata

**Hero Section** promotes:

- "50+ Projects"
- "Expert Mentors"
- "Real-world Skills"

#### 2. Project Detail Pages

**Route**: `/project/[id]`
**Components**:

- Project overview with images
- Technology stack display
- Learning outcomes and milestones
- Prerequisites and difficulty level
- Figma design links (when available)
- Enrollment CTA with access validation

#### 3. Search and Filtering

**Available Filters**:

- **Search**: Project title, description, technology keywords
- **Category**: Web Development, Mobile Development, Data Science, DevOps
- **Difficulty**: Beginner, Intermediate, Advanced
- **Access Type**: Free, Credits, All Access

**Filter State Management**: Uses `nuqs` for URL-driven state persistence.

### Project Enrollment Process

#### 1. Access Validation

**File**: `src/server/api/routers/project/utils/userHasAccess.ts`

```ts
export const userHasAccess = (user: User, projectTemplate: ProjectTemplate) => {
  if (user.mentorshipStatus === "ACTIVE") return true;
  if (projectTemplate.accessType === "FREE") return true;
  if (projectTemplate.accessType === "CREDITS") {
    return user.credits >= (projectTemplate.credits ?? 0);
  }
  return false;
};
```

**Access Logic**:

1. Active mentees: Unlimited access
2. Free templates: Always accessible
3. Credit templates: Require sufficient credits
4. Mentorship templates: Mentees only

#### 2. Project Creation Transaction

**File**: `src/server/api/routers/project/mutations/projectMutations.ts`

**Process**:

1. **Validation**: User exists, template exists, access granted
2. **Project Creation**: Copy template metadata to new project
3. **Sprint Cloning**: Recreate all template sprints with new IDs
4. **Epic Cloning**: Recreate all template epics with new IDs
5. **Task Cloning**: Recreate all tasks with proper relationships
6. **User Assignment**: Set user as project member and task assignee
7. **Credit Deduction**: Deduct credits for non-mentees on credit projects

**Database Transaction**: Ensures atomicity across all related entity creation.

#### 3. Post-Creation Actions

**Client-side** (`src/features/projects/hooks/useProjectMutations.ts`):

- Redirect to project workspace
- Invalidate project queries for fresh data
- Invalidate user credits for updated balance
- Show success notifications

### Project Workspace

#### Workspace Structure

**Route**: `/workspace/[id]`
**Layout**: Two-tab interface

**Tab 1: Kanban Board**

- Visual task management with drag-and-drop
- Column-based workflow (Backlog → Ready → In Progress → Review → Testing → Done)
- Real-time updates with optimistic UI
- Task filtering and search capabilities

**Tab 2: Backlog**

- Linear task list with ordering
- Bulk task operations
- Sprint and epic assignment
- Priority and status management

#### Task Management System

**Task Properties**:

- **Core**: Title, description, type (User Story, Task, Subtask, Bug)
- **Workflow**: Status, priority, order, blocked state
- **Planning**: Story points, due date, sprint/epic assignment
- **Development**: PR URL, assignee
- **Collaboration**: Comments, tags

**Task Status Flow**:

```
BACKLOG → READY_TO_DEVELOP → IN_PROGRESS → CODE_REVIEW → TESTING → DONE
```

**Task Types**:

- **USER_STORY**: Feature requirements from user perspective
- **TASK**: Implementation work items
- **SUBTASK**: Breakdown of larger tasks
- **BUG**: Defect resolution items

#### Sprint and Epic Management

**Sprints**: Time-boxed iterations with:

- Start and end dates
- Task assignments
- Progress tracking
- Ordered execution

**Epics**: Feature groupings containing:

- Multiple related tasks
- Status tracking (Planned, In Progress, Completed)
- Progress percentage
- Timeline planning

### Technical Implementation

#### Data Models

**Core Entities** (Prisma schema):

```prisma
model Project {
  id              String
  title           String
  description     String
  methodology     ProjectMethodologyEnum // SCRUM | KANBAN
  difficulty      ProjectDifficultyEnum  // BEGINNER | INTERMEDIATE | ADVANCED
  accessType      ProjectAccessTypeEnum  // FREE | CREDITS | MENTORSHIP
  figmaProjectUrl String?

  tasks    Task[]
  epics    Epic[]
  sprints  Sprint[]
  members  User[]
  category Category
}

model ProjectTemplate {
  id               String
  title            String
  description      String
  credits          Int?
  accessType       ProjectAccessTypeEnum
  status           ProjectStatusEnum // PENDING | APPROVED | REJECTED
  difficulty       ProjectDifficultyEnum
  expectedDuration String?
  preRequisites    String[]

  tasks            Task[]
  epics            Epic[]
  sprints          Sprint[]
  technologies     Technology[]
  learningOutcomes LearningOutcome[]
  milestones       Milestone[]
  images           ProjectImage[]
}
```

#### API Layer

**tRPC Routers**:

**Project Router** (`src/server/api/routers/project/`):

- `createProject`: Template instantiation with transaction
- `getEnrolled`: User's active projects
- `getById`: Project details with tasks/sprints/epics

**Template Router** (`src/server/api/routers/template/`):

- `getApproved`: Public catalog data
- `getInfoById`: Detailed template information
- `create/update/delete`: Admin management (admin-only)

**Task Router** (`src/server/api/routers/task/`):

- `createTask/updateTask/deleteTask`: CRUD operations
- `updateTaskOrders`: Bulk reordering with optimistic updates
- `getByProjectId`: Project task listing

#### State Management

**React Query Integration**:

- **Queries**: Template catalog, user projects, task lists
- **Mutations**: Project creation, task updates, status changes
- **Optimistic Updates**: Immediate UI feedback for task operations
- **Cache Invalidation**: Coordinated updates across related queries

**Filtering and Search**:

- **URL State**: `nuqs` for persistent filter state
- **Client Filtering**: `useMemo` derived state from cached queries
- **Real-time Search**: Debounced input with instant results

#### UI Components

**Project Catalog** (`src/features/projects/components/`):

- `Projects.tsx`: Main catalog with filtering
- `ProjectCard.tsx`: Template preview with enrollment CTA
- `ProjectDetail/`: Detailed template views

**Workspace** (`src/features/workspace/components/`):

- `board/KanbanBoard.tsx`: Drag-and-drop task board
- `backlog/Backlog.tsx`: Linear task management
- `tasks/TaskCard.tsx`: Individual task display

**Admin Interface** (`src/features/templates/components/`):

- `AdminTemplatesPage.tsx`: Template management dashboard
- `CreateProjectTemplateDialog.tsx`: Template creation wizard
- `EditTemplate/`: Template editing interfaces

### Credit and Payment Integration

#### Stripe Checkout Flow

**Endpoint**: `/api/checkout_sessions`
**Process**:

1. User selects credit package
2. Stripe session creation with metadata
3. Redirect to Stripe checkout
4. Webhook processes successful payment
5. Credits added to user account

**Credit Packages** (environment variables):

- `STRIPE_CREDITS_500_PRICE_ID`
- `STRIPE_CREDITS_1500_PRICE_ID`
- `STRIPE_CREDITS_3000_PRICE_ID`

#### Webhook Processing

**File**: `src/app/api/webhooks/stripe/route.ts`

**Events Handled**:

- `checkout.session.completed`: Add purchased credits
- `customer.subscription.updated`: Update mentorship status
- `customer.subscription.deleted`: Deactivate mentorship

### Admin Template Management

#### Template Lifecycle

**Status Flow**:

```
PENDING → APPROVED (public) / REJECTED / REQUESTED_CHANGES
```

**Admin Capabilities**:

- Create templates with full metadata
- Upload and manage project images
- Define learning outcomes and milestones
- Set prerequisites and difficulty levels
- Configure access type and credit costs
- Publish/unpublish templates

#### Template Creation Process

**Multi-step Form**:

1. **Basic Info**: Title, description, category, difficulty
2. **Project Type**: Access type and credit configuration
3. **Technologies**: Tech stack selection
4. **Content**: Learning outcomes, milestones, prerequisites
5. **Images**: Project screenshots and designs
6. **Review**: Final validation before submission

### Analytics and Monitoring

#### Business Metrics

**Template Performance**:

- Enrollment rates by template
- Completion rates by difficulty
- Revenue per template (credit-based)
- User progression through projects

**User Engagement**:

- Active projects per user
- Task completion velocity
- Workspace session duration
- Credit purchase patterns

#### Technical Monitoring

**Database Performance**:

- Query optimization for template catalog
- Transaction monitoring for project creation
- Index coverage for filtering operations

**API Metrics**:

- Response times for project operations
- Error rates for enrollment flow
- Cache hit rates for template queries

### Security and Data Integrity

#### Access Control

**Authentication**: Clerk-based with middleware protection
**Authorization**: Role-based (admin vs user) with procedure guards
**Data Validation**: Zod schemas for all inputs

#### Financial Security

**Stripe Integration**:

- Webhook signature verification
- Idempotent payment processing
- Secure credential management

**Credit System**:

- Atomic credit deduction
- Balance validation before enrollment
- Audit trail for all transactions

### Future Enhancements

#### Planned Features

**Collaboration**:

- Multi-user project teams
- Mentor assignment and reviews
- Peer code reviews

**Advanced Workflow**:

- Custom task statuses
- Automated sprint planning
- Progress tracking dashboards

**Gamification**:

- Achievement badges
- Skill progression tracking
- Leaderboards and challenges

#### Technical Improvements

**Performance**:

- Incremental static regeneration for templates
- Real-time collaboration with WebSockets
- Advanced caching strategies

**Developer Experience**:

- GraphQL schema stitching
- Automated testing coverage
- Component documentation

### Related Files

#### Core Business Logic

- `src/server/api/routers/project/mutations/projectMutations.ts`
- `src/server/api/routers/project/utils/userHasAccess.ts`
- `src/server/api/routers/template/queries/project/projectTemplateQueries.ts`

#### Data Models

- `prisma/models/project.prisma`
- `prisma/models/projectTemplate.prisma`
- `prisma/models/projectManagement.prisma`
- `prisma/models/user.prisma`

#### UI Components

- `src/features/projects/components/Projects.tsx`
- `src/features/projects/components/ProjectCard.tsx`
- `src/features/workspace/components/board/KanbanBoard.tsx`
- `src/features/workspace/components/backlog/Backlog.tsx`

#### State Management

- `src/features/projects/hooks/useProject.ts`
- `src/features/projects/hooks/useProjectMutations.ts`
- `src/features/workspace/hooks/useTask.ts`

#### Payment Integration

- `src/app/api/checkout_sessions/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/features/checkout/constants/products.ts`

#### Admin Interface

- `src/features/templates/components/AdminTemplatesPage.tsx`
- `src/features/templates/components/CreateProjectTemplateDialog.tsx`
- `src/features/templates/hook/useAdminTemplates.ts`

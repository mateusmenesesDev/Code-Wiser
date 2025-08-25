## Current Features

### Authentication and Authorization

- Clerk-based authentication with middleware.
- Organization-aware roles; admin UI guarded with `Protect role="org:admin"`.
- tRPC guards: `publicProcedure`, `protectedProcedure`, `adminProcedure`.
- SSO callback page and Clerk webhooks syncing users to DB.

### Project Templates (Admin)

- Manage templates: create, update basic info, images, technologies, learning outcomes, milestones.
- Publish workflow via status updates (APPROVED, PENDING, etc.).
- Admin-only UI at `admin/templates` with filters, search, and actions.
- API: `projectTemplate.*` queries/mutations (admin-only for mutations).

### Project Catalog and Enrollment

- Public catalog lists approved templates on home page.
- Project detail page with images, overview, outcomes, milestones, and metadata.
- Start project from a template → creates project with sprints, epics, tasks, and member enrollment.
- User credits are decremented for credit-gated templates when applicable.

### My Projects

- Lists user-enrolled projects with skeleton states.
- Links into each project workspace.

### Workspace

- Project header, stats, and optional Figma design link card.
- Tabs: Kanban board and Backlog.
- Kanban board with filters and skeleton states; loads project tasks.
- Backlog with drag-and-drop reordering, create/edit tasks dialog.

### Tasks

- CRUD operations, assignment, ordering within backlog, linkage to sprints/epics.
- Task comments with list and mutations.
- Task tags and basic metadata (priority, status, etc.).

### Sprints

- List sprints for a project, create/update/delete, update order.

### Epics

- Create/update/delete epics and query epics by project.

### Comments

- Add/update/delete comments on tasks; fetch comments by task ID.

### Checkout and Payments

- Stripe checkout for purchasing credits.
- Webhook handling for checkout completion and subscriptions (mentorship status updates, credit addition).

### Uploads

- UploadThing integration for image uploads gated by auth.

### Dashboard (UI)

- Dashboard shell with cards, active projects, upcoming meetings, recent activity (static/mocked in places).

### Admin Template Editing

- Edit template basic info, images, and manage publication status.

## Key API Endpoints (tRPC routers)

- `user`: create/read/update/delete (DB sync with Clerk), get credits/avatar.
- `projectTemplate`: list approved/public info; admin mutations for create/update/delete, images, status.
- `project`: get by id (with category/epics/sprints/tasks), get enrolled, progress, last activity; create from template.
- `task`: list by project/template; create/update/delete; ordering and batch ops.
- `sprint`: list by project; create/update/delete; ordering.
- `epic`: list by project; create/update/delete.
- `comment`: list by task; create/update/delete.

## App Routes

- Home: lists approved templates and user’s enrolled projects when signed in.
- My Projects: grid of enrolled projects.
- Workspace `workspace/[id]`: project header, stats, design link, tabs (Kanban, Backlog).
- Project `project/[id]`: project overview for templates or instantiated projects as applicable.
- Admin Templates: list/edit/manage templates; edit screens under `admin/templates/[id]/edit`.
- Pricing, Success, Canceled: Stripe-related UX pages.
- Auth: SSO callback route.

## Integrations

- Clerk: auth, org roles, webhooks.
- Stripe: checkout and webhooks for credits/subscriptions.
- UploadThing: authenticated image uploads.

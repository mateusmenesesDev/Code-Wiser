# PRD: Sprint Board

## Problem Statement

Project members working on Scrum-methodology projects currently have no first-class sprint management experience in the workspace. The Kanban board shows all project tasks at once regardless of sprint, and sprint-related tooling (sprint list, backlog table, sprint assignment) is only available to template admins in the admin area — completely hidden from regular project members.

As a result, teams cannot plan or run sprints effectively: there is no way to see which tasks belong to the current sprint, no visibility into how many story points are committed, no sprint lifecycle (start / complete), and no drag-and-drop flow to move tasks from backlog into a sprint. Members have to rely on workarounds like the task dialog's sprint dropdown, which is disconnected from any planning surface.

## Solution

Introduce a Jira-inspired sprint management experience directly in the project workspace. The solution adds:

1. **A Sprint Sidebar** — a panel on the workspace listing all sprints grouped by status (Planning, Active, Completed), with story point totals and progress at a glance.
2. **A Sprint Detail Board** — clicking a sprint opens a scoped view showing only that sprint's tasks, toggling between a Kanban-column view and a list view.
3. **A Backlog Tab** — a dedicated view for unassigned tasks (no sprint) where members can drag tasks into sprints via the sidebar or assign them using an inline sprint selector.
4. **Sprint Lifecycle** — sprints progress through `PLANNING → ACTIVE → COMPLETED`; only one sprint can be active at a time; completing a sprint automatically moves unfinished tasks to the backlog.
5. **Inline Task Creation** — a quick-add row at the bottom of each sprint automatically assigns the new task to that sprint.

## User Stories

### Sprint Navigation & Overview

1. As a project member, I want to see a sidebar listing all sprints for my project, so that I can quickly understand the sprint landscape at a glance.
2. As a project member, I want sprints in the sidebar to be grouped by status (Planning, Active, Completed), so that I can immediately identify what is running now versus what is upcoming or past.
3. As a project member, I want to see the total story points for each sprint in the sidebar, so that I can assess commitment without opening the sprint.
4. As a project member, I want to see a progress indicator (tasks completed vs total) for each sprint in the sidebar, so that I can track sprint health at a glance.
5. As a project member, I want to click a sprint in the sidebar to open its detail board, so that I can focus on the tasks of that specific sprint.
6. As a project member, I want the active sprint to be visually highlighted in the sidebar, so that I can instantly identify what the team is currently working on.
7. As a project member, I want to collapse or expand the sidebar, so that I can maximize board space when needed.

### Sprint Lifecycle

8. As a project member, I want to create a new sprint with a title, description, start date, and end date, so that I can define the next planning iteration.
9. As a project member, I want to start a sprint (transition it from Planning to Active), so that the team knows which sprint is in progress.
10. As a project member, I want the system to prevent starting a second sprint if one is already active, so that focus is maintained on a single sprint at a time.
11. As a project member, I want to complete an active sprint, so that I can formally close the iteration and move forward.
12. As a project member, I want unfinished tasks to be automatically moved back to the backlog when a sprint is completed, so that no work is lost and it can be planned into future sprints.
13. As a project member, I want to edit a sprint's title, description, and dates at any time (while it is in Planning or Active status), so that plans can evolve.
14. As a project member, I want to delete a sprint (in Planning status only), so that mistakenly created sprints can be removed; tasks remain in the backlog.
15. As a project member, I want to see a sprint's status badge (Planning / Active / Completed) on its detail view header, so that the context is always clear.

### Sprint Detail Board — Kanban View

16. As a project member, I want to view a sprint's tasks as Kanban columns (To Do / In Progress / Done) scoped only to that sprint, so that I can see the workflow state of committed work.
17. As a project member, I want to drag task cards between Kanban columns within a sprint, so that I can update task status without opening the task dialog.
18. As a project member, I want each task card to display its story point badge, so that I can see effort at a glance while managing the board.
19. As a project member, I want to see the total story points per Kanban column, so that I can understand how work is distributed across workflow states.
20. As a project member, I want to click on a task card to open the task detail dialog, so that I can view or edit full task information.
21. As a project member, I want to drag the order of cards within a column, so that I can prioritize work visually.

### Sprint Detail Board — List View

22. As a project member, I want to toggle the sprint detail board to a list view, so that I can see tasks in a table format when a Kanban board is too wide.
23. As a project member, I want the list view to group tasks by status, so that the same workflow structure is preserved.
24. As a project member, I want each row in the list view to show the task title, priority, assignee, story points, and status, so that I can triage effectively.
25. As a project member, I want to reorder tasks by dragging rows in the list view, so that I can set priorities without switching views.

### Task Assignment to Sprints

26. As a project member, I want to add an existing backlog task to a sprint directly from the Backlog view by dragging it onto a sprint in the sidebar, so that sprint planning is a visual and fast workflow.
27. As a project member, I want to remove a task from a sprint (move it back to the backlog) from the sprint detail board, so that scope can be adjusted mid-sprint.
28. As a project member, I want to move a task from one sprint to another via an inline sprint selector on the task card, so that I can reschedule tasks without leaving the board.
29. As a project member, I want to add a task to a sprint from the Backlog view using an inline sprint selector cell, so that I have a table-based alternative to drag-and-drop.

### Inline Task Creation

30. As a project member, I want a quick-add row at the bottom of each sprint (in both Kanban and list views) so that I can create a task and have it automatically assigned to that sprint without navigating away.
31. As a project member, I want the quick-add row to accept at minimum a task title, so that friction for adding new work is minimal.
32. As a project member, I want the newly created task to appear immediately in the sprint board after creation, so that the experience feels instant.

### Backlog View

33. As a project member, I want a dedicated Backlog tab in the workspace so that I can manage all tasks that are not yet assigned to a sprint.
34. As a project member, I want the Backlog view to show tasks grouped by epic (or no epic), so that related work is clustered together.
35. As a project member, I want each backlog row to show story points, priority, assignee, epic, and tags inline, so that I can assess and update tasks without a dialog.
36. As a project member, I want to drag backlog tasks onto a sprint in the sidebar to assign them, so that sprint planning is a fluid drag-and-drop experience.
37. As a project member, I want a quick-create row at the bottom of the backlog so that I can add tasks directly to the backlog without opening a dialog.

### Story Points & Progress

38. As a project member, I want to see the total story points committed to a sprint on the sprint detail view header, so that I can understand the workload at a glance.
39. As a project member, I want story points to update immediately when tasks are added or removed from a sprint, so that planning totals are always accurate.
40. As a project member, I want each task card (Kanban view) and each row (list view) to show a story point badge, so that effort is visible wherever tasks are displayed.
41. As a project member, I want the sidebar sprint entry to show a "X / Y pts done" indicator, so that sprint progress in points is visible without opening the sprint.

## Implementation Decisions

### Navigation & Layout

- The workspace layout (`Workspace.tsx`) will be extended with a collapsible **Sprint Sidebar** on the left side. The sidebar is only visible when the project's methodology is `SCRUM`.
- The workspace main content area will support three views: **Current Kanban** (existing, default), **Sprint Detail Board** (rendered when a sprint is selected), and **Backlog** (accessed via a "Backlog" entry pinned at the top/bottom of the sidebar).
- URL state (via `nuqs`) will track the active sidebar selection: `?view=backlog` or `?view=sprint&sprintId=<id>`. No new routes are needed.
- The existing sprint filter dropdown in `ProjectHeader` will be hidden when the sidebar is active to avoid confusion.

### Data Model Changes

- Add a `SprintStatus` enum to the Prisma schema: `PLANNING | ACTIVE | COMPLETED`.
- Add a `status` field (`SprintStatus`, default `PLANNING`) to the `Sprint` model.
- A database-level or server-level constraint will enforce that at most one sprint per project can have `status = ACTIVE` at a time.
- No new fields are required for story points (already on `Task`) or progress (computed server-side from task counts/points).

### Sprint Lifecycle API

- New tRPC mutations: `sprint.start` (sets status to `ACTIVE`, rejects if another sprint is already active), `sprint.complete` (sets status to `COMPLETED`, moves all non-`DONE` tasks to backlog by clearing their `sprintId`).
- Existing `sprint.create`, `sprint.update`, `sprint.delete` mutations remain; delete is gated to `PLANNING` status sprints only.
- All sprint mutations must include proper access checks (currently `getById` and `updateOrder` lack them).

### Sprint Detail Board

- A new `SprintBoard` feature component will render the sprint's tasks in two modes: **Kanban** and **List**. A toggle button switches between them.
- Kanban mode reuses the `KanbanColumn` / `KanbanCard` components (or a scoped variant) from the existing kanban feature, filtered to the selected sprint.
- List mode reuses a variant of the existing `Backlog` table row component (`DraggableTaskRow`).
- Drag-and-drop between Kanban columns updates `task.status` via `task.update` (existing mutation).
- An inline "Add task" quick-add row lives at the bottom of each column/section; submitting calls `task.create` with the sprint pre-filled.

### Backlog View

- The existing `Backlog` component (currently admin-only) is promoted to be usable in the user workspace.
- It will be scoped to show only tasks where `sprintId IS NULL` and `status = BACKLOG` (or all non-sprint tasks, TBD by product).
- The sidebar sprint entries will serve as drop targets; dropping a backlog task onto a sprint entry calls `task.update({ sprintId })`.

### Sprint Sidebar

- A new `SprintSidebar` component renders the list of sprints from `sprint.getAllByProjectId`.
- Each sprint entry shows: status badge, title, date range, story point total (sum of `task.storyPoints`), and a mini progress bar (done tasks / total tasks).
- Story point totals are computed server-side and included in the `sprint.getAllByProjectId` response (extend the query to include `_count` and aggregation).
- A "Backlog" pinned item at the top or bottom navigates to the backlog view.
- A "Create Sprint" button opens the existing `SprintDialog` (extended to include date fields and the new status concept).

### Access Control

- All project members (any role) can create, edit, start, and complete sprints.
- Template admins retain their existing admin-area sprint management via the template editor (no changes there).

### Methodology Guard

- Sprint sidebar and sprint board views are only available when `project.methodology === 'SCRUM'`. Kanban-methodology projects continue to use the existing Kanban-only workspace without the sidebar.

## Out of Scope

- **Burndown charts / velocity metrics** — no sprint metrics or reporting in this iteration.
- **Parallel active sprints** — only one sprint can be active at a time.
- **User prompt on sprint completion for incomplete tasks** — unfinished tasks automatically return to the backlog (no per-task decision dialog).
- **Sprint capacity planning** — no concept of team member capacity (hours/points available per person).
- **Notifications / emails for sprint events** — no notifications when sprints start or complete.
- **Sprint templates** — the template-editor sprint management (admin area) is not changed.
- **Mobile-optimized sprint board** — the board is desktop-first; no specific mobile layout.
- **Comments or activity log on sprints** — sprint-level comments are out of scope.

## Further Notes

- The existing `Backlog` and `SprintList` components (currently admin-only) should be refactored for reuse in the user workspace rather than duplicated.
- The `SprintDialog` should be updated to expose the `startDate` and `endDate` fields (already in the schema but hidden from the UI).
- Access check gaps in `sprint.getById` and `sprint.updateOrder` should be patched as part of this work.
- The `ProjectHeader` sprint filter dropdown may be retired or repurposed (e.g., shown only for Kanban-methodology projects) once the sidebar exists for SCRUM projects.
- Story point aggregation on the sprint query should be done at the DB level (Prisma `_sum` aggregate) to avoid loading all task payloads into memory just to sum points.

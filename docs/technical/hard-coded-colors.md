# Hard-Coded Colors Inventory

This document catalogs all hard-coded color values found in the codebase that should be replaced with design system tokens.

## Status Colors

### Green (Success/Approved)
- **Location**: Multiple files
- **Usage**: Success states, approved statuses, completed tasks
- **Examples**:
  - `bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
  - `bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400`
  - `bg-green-600 hover:bg-green-700`
  - `text-green-500`, `text-green-600`, `text-green-700`
  - `border-green-200 dark:border-green-900/50`
  - `#10b981`, `#10B981`, `#059669` (hex)

### Red (Destructive/Error)
- **Location**: Multiple files
- **Usage**: Error states, destructive actions, rejected statuses
- **Examples**:
  - `bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`
  - `bg-red-50 text-red-700`
  - `text-red-500`, `text-red-600`, `text-red-700`
  - `hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20`

### Yellow (Warning/Pending)
- **Location**: Multiple files
- **Usage**: Warning states, pending statuses, in-review tasks
- **Examples**:
  - `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`
  - `bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400`
  - `text-yellow-300`, `text-yellow-600`, `text-yellow-800`
  - `border-yellow-200 dark:border-yellow-800`
  - `#F59E0B`, `#f59e0b`, `#d97706` (hex)

## Primary Action Colors

### Blue (Primary/Info)
- **Location**: Multiple files
- **Usage**: Primary actions, info states, active states
- **Examples**:
  - `bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800`
  - `bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`
  - `bg-blue-500 text-white hover:bg-blue-600`
  - `bg-blue-600 hover:bg-blue-700`
  - `text-blue-500`, `text-blue-600`, `text-blue-700`
  - `border-blue-200 dark:border-blue-800`
  - `#3B82F6` (hex)

### Purple (Epic/Feature)
- **Location**: Multiple files
- **Usage**: Epic-related UI, feature highlights, premium features
- **Examples**:
  - `bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400`
  - `bg-purple-100 dark:bg-purple-900/20`
  - `bg-purple-500 text-white hover:bg-purple-600`
  - `bg-purple-600 hover:bg-purple-700`
  - `text-purple-500`, `text-purple-600`, `text-purple-700`
  - `border-purple-200 dark:border-purple-900/50`
  - `#8B5CF6` (hex)

## Task Status Colors

### Amber (In Progress)
- **Location**: `src/features/workspace/utils/kanbanColumns.ts`
- **Usage**: In Progress task status
- **Examples**:
  - `bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800`

### Violet (Code Review)
- **Location**: `src/features/workspace/utils/kanbanColumns.ts`
- **Usage**: Code Review task status
- **Examples**:
  - `bg-violet-50 border-violet-200 dark:bg-violet-950/50 dark:border-violet-800`
  - `#8B5CF6` (hex)

### Orange (Testing)
- **Location**: `src/features/workspace/utils/kanbanColumns.ts`
- **Usage**: Testing task status
- **Examples**:
  - `bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800`
  - `text-orange-600`

### Emerald (Done)
- **Location**: `src/features/workspace/utils/kanbanColumns.ts`
- **Usage**: Done task status
- **Examples**:
  - `bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800`
  - `#10B981` (hex)

### Slate (Backlog)
- **Location**: `src/features/workspace/utils/kanbanColumns.ts`
- **Usage**: Backlog task status
- **Examples**:
  - `bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700`
  - `bg-slate-950`
  - `#64748B` (hex)

## Neutral Colors

### Gray
- **Location**: Multiple files
- **Usage**: Neutral states, disabled states, placeholders
- **Examples**:
  - `bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`
  - `bg-gray-200`
  - `text-gray-400`, `text-gray-500`, `text-gray-600`, `text-gray-700`
  - `border-gray-200`, `border-gray-300`, `border-gray-700`

## Files with Hard-Coded Colors

### Components
1. `src/features/prReview/components/ReviewTable.tsx` - Status badges (green, red, yellow)
2. `src/features/prReview/components/ReviewActions.tsx` - Approve button (green)
3. `src/common/components/ui/badge.tsx` - Badge variants (green, yellow, purple)
4. `src/features/task/components/PullRequest.tsx` - PR status colors
5. `src/features/kanban/components/KanbanCardContent.tsx` - Sprint badge (blue)
6. `src/features/epics/components/EpicList/EpicItem.tsx` - Epic colors (purple, green, red)
7. `src/features/sprints/components/SprintItem.tsx` - Sprint colors (blue, green, red)
8. `src/features/sprints/components/SprintList.tsx` - Sprint action buttons (blue)
9. `src/features/sprints/components/SprintDialog.tsx` - Dialog buttons (blue)
10. `src/features/epics/components/EpicList/EpicList.tsx` - Epic buttons (purple)
11. `src/features/epics/components/EpicDialog.tsx` - Dialog buttons (purple)
12. `src/features/projects/components/ProjectCard.tsx` - Project card colors (blue, gray)
13. `src/features/projects/components/ProjectDetail/ProjectDetailSidebar.tsx` - Warning messages (red)
14. `src/features/projects/components/ProjectDetail/ProjectImageGallery.tsx` - Gallery colors (gray, blue)
15. `src/features/workspace/components/ProjectStatsCards.tsx` - Icon colors (blue, green, orange, gray)
16. `src/features/workspace/components/DesignFileCard.tsx` - Design file colors (purple)
17. `src/features/templates/components/*` - Template buttons (blue)
18. `src/app/(system)/pricing/page.tsx` - Pricing page colors (blue, purple, green)
19. `src/app/(system)/mentor/page.tsx` - Icon colors (blue)
20. `src/common/components/ErrorMessage.tsx` - Error text (red)
21. `src/common/components/layout/Header/HeaderAvatarMenu.tsx` - Logout text (red)
22. `src/features/backlog/components/DraggableTaskRow.tsx` - Delete button (red)
23. `src/features/planningPoker/components/VotingCards.tsx` - Card borders (gray)
24. `src/features/planningPoker/components/MemberList.tsx` - Check icon (green)
25. `src/features/task/components/TaskDialogContent.tsx` - Various colors (red, purple)

### Utilities
1. `src/common/utils/colorUtils.ts` - Centralized color utilities (green, yellow, blue, gray)
2. `src/features/workspace/utils/kanbanColumns.ts` - Kanban column colors (slate, blue, amber, violet, orange, emerald)

### Constants
1. `src/features/kanban/constants/index.ts` - Hex color values for task statuses

### Services
1. `src/server/services/email/emailService.ts` - Email template colors (hex values)

### Icons
1. `src/common/components/icons/GoogleIcon.tsx` - Google brand colors (hex values)

## Color Patterns Identified

### Pattern 1: Status Badges
- Success: `bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
- Warning: `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`
- Destructive: `bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`

### Pattern 2: Action Buttons
- Primary: `bg-blue-600 hover:bg-blue-700`
- Success: `bg-green-600 hover:bg-green-700`
- Purple: `bg-purple-600 hover:bg-purple-700`

### Pattern 3: Kanban Columns
- Each status has: `bg-{color}-50 border-{color}-200 dark:bg-{color}-950/50 dark:border-{color}-800`

### Pattern 4: Icon Colors
- Info: `text-blue-600`
- Success: `text-green-500`, `text-green-600`
- Warning: `text-yellow-600`
- Error: `text-red-600`
- Purple: `text-purple-500`, `text-purple-600`

## Recommended Design System Tokens

Based on the analysis, the following tokens should be added to `globals.css`:

1. **Success colors** (green variants)
2. **Warning colors** (yellow/amber variants)
3. **Info colors** (blue variants)
4. **Epic/Feature colors** (purple variants)
5. **Task status colors** (amber, violet, orange, emerald, slate)
6. **Neutral gray variants** (if not already covered)

Each should have:
- Base color
- Light variant (for backgrounds)
- Dark variant (for dark mode backgrounds)
- Text color
- Border color
- Hover states


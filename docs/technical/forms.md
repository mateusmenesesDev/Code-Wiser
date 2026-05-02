# Forms and validation

Forms use React Hook Form for state and Zod for validation. Keep schemas near the owning feature and validate again at the API boundary.

## Core files

- `src/common/components/ui/form.tsx`: shadcn/Radix + React Hook Form wrapper (`Form`, `FormField`, `FormItem`, `FormControl`, `FormMessage`, etc.).
- `src/common/components/RichText.tsx`: TipTap editor integrated with form context and UploadThing image upload.
- `src/features/*/schemas/*.schema.ts`: feature-owned Zod schemas.
- `src/features/schemas/*`: shared schema helpers only.

## Ownership

- Feature form UI belongs in `src/features/<domain>/components`.
- Feature schemas belong in `src/features/<domain>/schemas` unless shared by multiple domains.
- Server procedures should import/reuse schemas or define boundary-specific schemas close to the owning router.
- Avoid putting domain validation in `common`.

## Standard pattern

1. Define a Zod schema for the form/API input.
2. Initialize React Hook Form with `zodResolver(schema)` and typed defaults.
3. Use `FormField` for controlled components (`Select`, custom inputs, rich text, dialogs).
4. Use simple registered inputs only when they stay simple.
5. Submit through a tRPC mutation or route handler.
6. On success, reset/close/navigate and invalidate affected queries.
7. On error, show a user-facing message and map field errors where useful.

## Important existing forms

- Templates: `src/features/templates/components/CreateProjectTemplateDialog.tsx`, edit-template components, and `templates/schemas/template.schema.ts`.
- Tasks/comments: `src/features/task/components/TaskDialog*.tsx`, `src/features/workspace/schemas/task.schema.ts`, `workspace/schemas/comment.schema.ts`.
- Sprints/epics: `src/features/sprints/components/SprintDialog.tsx`, `src/features/epics/components/EpicDialog.tsx`.
- Users/admin: `src/features/users/components/EditUserDialog.tsx`.
- Feedback/PR review/planning poker/mentorship: feature-local component and schema folders.

## Validation guidance

- Prefer schema-first validation with clear messages.
- Use `refine`/`superRefine` for cross-field business rules.
- Build create/update schemas from shared base pieces only when it reduces duplication without hiding intent.
- Do not trust client validation; tRPC `.input(schema)` or route-handler parsing is the source of truth.
- Keep transforms explicit. If UI shape differs from API shape, name the conversion and keep it near the form or feature utility.

## State guidance

- Form state stays in React Hook Form.
- Dialog open/close can be local state or shared dialog atoms when multiple components coordinate.
- Server data comes from tRPC/React Query; do not copy query results into form state except for edit defaults/reset.
- URL-backed filters use `nuqs`, not form state.

## Review checklist

- Schema lives with the domain and is reused at the server boundary.
- Mutation is protected by the correct procedure.
- Submit handler invalidates the minimum affected queries.
- Edit forms call `reset` when loaded data/dialog target changes.
- Complex inputs use `FormField` + `FormControl` so labels, ARIA, and errors stay wired.

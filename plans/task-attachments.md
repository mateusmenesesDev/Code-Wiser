# Plan: Task File Attachments

> Source PRD: `plans/prd-task-attachments.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Entity**: `TaskAttachment` — one-to-many on `Task` (covers project tasks and template tasks via existing dual ownership). No attachments on comments, epics, sprints, or projects.
- **Schema shape** (minimum fields): `id`, `createdAt`, `updatedAt`, `taskId`, `uploaderId`, `url`, `key` (UploadThing file key), `originalFileName`, `displayName`, `contentType`, `sizeBytes`. Ordered by `createdAt` ascending. DB cascade delete from Task → attachments.
- **Storage**: UploadThing. Dedicated file route for task attachments (allowed types, max 10MB per file, authenticated). Server deletes blobs via `UTApi` on attachment delete, replace, and task delete.
- **API**: tRPC procedures under the task domain (or a nested attachments router): list by task, link after upload, rename display name, replace file, delete. Same membership/template-editor auth spirit as existing task mutations; any authorized member may mutate any attachment on that task.
- **Limits**: max 5 attachments per task; max 10MB per file; allowed extensions: `.md`, `.pdf`, `.doc`, `.docx`, `png`, `jpg`/`jpeg`, `webp`, `gif`.
- **UI surface**: Anexos section inside the task dialog (create + edit). Dropzone + list. No reorder UI. TipTap inline images remain separate and unchanged.
- **Create flow**: client-only staging until the task is persisted; upload + link only after successful create (avoids orphaned blobs on abandoned create).
- **Preview**: formatted Markdown in modal/drawer; image thumbnail/lightbox; PDF and Word are download-only.

---

## Phase 1: Attach, list, download, delete on existing task

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 19, 20, 21, 27, 28, 29, 30, 31

### What to build

End-to-end attachments for **already saved** tasks (project and template): schema + UploadThing route + API + Anexos UI in the edit task dialog.

A member opens a task, uploads allowed files via dropzone, sees them listed (display name, type affordance, uploader), downloads any file, and deletes attachments (DB + storage). Limits (5 files, 10MB, types) and membership/template-editor auth are enforced. Empty state, progress/error toasts, and list refresh after mutations are included. Create-dialog staging and previews are deferred.

### Acceptance criteria

- [x] `TaskAttachment` exists and relates to `Task` with cascade delete in the database
- [x] UploadThing route accepts only the agreed types at ≤ 10MB and requires authentication
- [x] Authorized project members and template editors can link, list, download, and delete attachments; non-members are rejected
- [x] Anexos section appears in the edit task dialog with dropzone, empty state, and list ordered by upload time
- [x] List shows display name, type affordance, and who uploaded each file
- [x] Max 5 attachments per task is enforced client- and server-side with a clear error when exceeded
- [x] Disallowed type or oversized file shows a clear error
- [x] Download works for all attachment types
- [x] Deleting an attachment removes the DB row and the UploadThing file
- [x] Successful mutations refresh the list; failures show toast/inline error
- [x] Same Anexos experience works for template tasks

---

## Phase 2: Rename & replace

**User stories**: 16, 17, 18

### What to build

From an attachment row, members can rename the **display name** (blob unchanged) and **replace** the file in the same attachment record. Replace validates type/size like a new upload, uploads the new file, updates metadata/url/key, and deletes the previous blob from storage.

### Acceptance criteria

- [x] Rename updates only `displayName` with non-empty validation; storage key/url unchanged
- [x] Replace accepts a new allowed file ≤ 10MB into the same attachment slot
- [x] After replace, list shows the new file metadata and the old UploadThing object is deleted
- [x] Replace failures leave the previous attachment intact and report an error
- [x] Any authorized member can rename/replace any attachment on the task

---

## Phase 3: Cleanup on task delete

**User stories**: 22

### What to build

When a task is deleted, all related attachment DB rows are removed (cascade) and every corresponding UploadThing file is deleted so no orphaned blobs remain.

### Acceptance criteria

- [ ] Deleting a task removes all of its `TaskAttachment` rows
- [ ] Deleting a task deletes all associated UploadThing files via `UTApi`
- [ ] Task delete still succeeds if a given storage delete fails only after a best-effort cleanup attempt is logged/handled without leaving the task half-deleted in the DB (prefer: collect keys, delete task+rows in a transaction, then best-effort UT cleanup — document chosen order in implementation)

---

## Phase 4: Staging on task create

**User stories**: 10, 11, 12, 32

### What to build

In the **create** task dialog, members can select files into temporary client state (no upload yet). After the task is saved successfully, staged files upload and link to the new task. Partial batch success is kept; failures are reported per file. If task create fails, staged files remain so the user can retry without re-selecting. Closing the dialog without creating discards the staging (no orphan uploads).

### Acceptance criteria

- [ ] Anexos section is usable while creating a task; selected files appear as staged pending items
- [ ] No UploadThing upload occurs until the task is successfully created
- [ ] After create, staged files upload/link respecting the 5-file and type/size rules
- [ ] If some uploads fail, successful ones remain linked and failures are reported for retry
- [ ] If task create fails, staged files remain in the dialog
- [ ] Closing/canceling create without saving discards staged files without creating storage objects
- [ ] Upload progress is visible during the post-create upload batch

---

## Phase 5: Markdown & image preview

**User stories**: 23, 24, 25, 26

### What to build

Read-only previews from the attachment list: `.md` opens a modal/drawer with sanitized formatted Markdown; images show thumbnail and/or lightbox. PDF and Word remain download-only (no in-app document viewer).

### Acceptance criteria

- [ ] `.md` attachments expose a preview action that opens a modal/drawer
- [ ] Markdown preview renders common formatting (headings, lists, links, code blocks) with sanitization for user-supplied content
- [ ] Image attachments show thumbnail and/or lightbox preview and remain downloadable
- [ ] PDF, `.doc`, and `.docx` show download only (no preview action)
- [ ] Preview works for both project and template tasks

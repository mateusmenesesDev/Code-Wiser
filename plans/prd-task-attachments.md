# PRD: Task File Attachments

## Problem Statement

When working on a task, members often need auxiliary reference material that does not belong in the task description — for example a color palette in Markdown for a CSS task, a PDF brief, a Word doc with acceptance notes, or a reference screenshot. Today, tasks only support rich-text descriptions (with inline images via UploadThing). There is no first-class way to attach, list, preview, rename, replace, or download supporting files on a task (including template tasks). Teams resort to pasting content into the description or sharing files outside the product, which scatters context and weakens the task as the single place to do the work.

## Solution

Add first-class **file attachments on tasks** (project tasks and template tasks), available from the task dialog.

Members can upload up to **5 files per task**, each up to **10MB**, in these types: `.md`, `.pdf`, `.doc`, `.docx`, and images (`png`, `jpg`/`jpeg`, `webp`, `gif`). Attachments are a **complement** to the description, not a replacement for it.

From the Anexos section in the task dialog, members can:

- Upload via dropzone (including while creating a task — files stay in a temporary client state until the task is persisted, then upload and link)
- See who uploaded each file
- Rename the display name
- Replace a file in place
- Download any file
- Preview Markdown (formatted) and images (thumbnail / lightbox)
- Download-only for PDF and Word documents
- Delete an attachment (and remove it from storage); deleting a task also deletes its files from storage

Any project member (and any template editor, for template tasks) can add or remove attachments, including ones uploaded by someone else. Partial upload success is kept (files that completed stay; failed ones can be retried).

## User Stories

### Discoverability & Access

1. As a project member, I want an Anexos section in the task dialog when creating or editing a task, so that I can manage supporting files without leaving the task context.
2. As a template editor, I want the same Anexos section on template tasks, so that reference files ship with the template work items.
3. As a project member, I want to see how many attachments a task already has (and that the limit is 5), so that I know whether I can add more.
4. As a project member, I want attachment actions available to any project member, so that collaboration is not blocked by who originally uploaded a file.

### Upload

5. As a project member, I want to upload one or more allowed files via a dropzone in Anexos, so that I can attach auxiliary material quickly.
6. As a project member, I want the system to accept `.md`, `.pdf`, `.doc`, `.docx`, `png`, `jpg`/`jpeg`, `webp`, and `gif`, so that common reference formats are covered.
7. As a project member, I want each file limited to 10MB, so that storage and upload time stay reasonable.
8. As a project member, I want at most 5 attachments per task, so that tasks stay focused and do not become file dumps.
9. As a project member, I want a clear error when I try to upload a disallowed type, oversized file, or a 6th attachment, so that I know how to fix the problem.
10. As a project member, I want to select files while creating a task (before it exists), keep them in temporary client state, and have them upload and link after the task is saved, so that I do not need a two-step create-then-attach flow.
11. As a project member, if some files in a batch succeed and others fail, I want the successful ones kept and the failures reported, so that I do not lose progress and can retry only what failed.
12. As a project member, I want upload progress feedback, so that I know large files are still uploading.

### Listing & Metadata

13. As a project member, I want a list of attachments showing each file’s display name, type indicator, and who uploaded it, so that I can identify files and ownership at a glance.
14. As a project member, I want attachments ordered by upload time (no manual reorder), so that the list stays simple and predictable.
15. As a project member, I want empty-state copy when there are no attachments, so that the dropzone purpose is obvious.

### Rename, Replace, Download, Delete

16. As a project member, I want to rename an attachment’s display name without re-uploading, so that names stay meaningful in the list while the stored file is unchanged.
17. As a project member, I want to replace an attachment with a new file in the same slot, so that I can update a palette or brief without creating a duplicate entry.
18. As a project member, I want replacing a file to delete the previous file from storage, so that orphaned blobs are not left behind.
19. As a project member, I want to download any attachment, so that I can open it locally in the right tool.
20. As a project member, I want to delete an attachment I or someone else uploaded, so that outdated references can be cleaned up by anyone on the team.
21. As a project member, I want deleting an attachment to remove it from storage immediately, so that deleted files are not recoverable via old URLs from our product’s intended lifecycle.
22. As a project member, when I delete a task, I want all of its attachments removed from the database and storage, so that task deletion fully cleans up related files.

### Preview

23. As a project member, I want to preview a `.md` attachment as formatted Markdown in a modal or drawer, so that I can read specs and palettes without downloading.
24. As a project member, I want Markdown preview to render common formatting (headings, lists, links, code blocks, etc.), so that the content is readable as intended.
25. As a project member, I want to preview image attachments (thumbnail in the list and/or lightbox), so that visual references are usable in place.
26. As a project member, I want PDF and Word (`.doc` / `.docx`) attachments to be download-only (no in-app preview), so that we avoid brittle document viewers while still supporting those formats.

### Permissions & Templates

27. As a project member, I want any other project member to be able to upload, rename, replace, download, preview, and delete attachments on tasks in our project, so that the team shares ownership of task context.
28. As a template editor, I want to manage attachments on template tasks with the same capabilities, so that templates can include starter reference files for mentees.
29. As an unauthenticated or non-member user, I want attachment mutations to be rejected, so that project files stay restricted to authorized members.

### Resilience & Feedback

30. As a project member, I want toast or inline errors when upload, rename, replace, or delete fails, so that I can recover without guessing.
31. As a project member, I want the attachments list to refresh after successful mutations, so that the UI always matches the server.
32. As a project member, if task creation fails after I staged temporary files, I want those files to remain staged in the dialog so I can retry save without re-selecting them.

## Implementation Decisions

### Scope of entity

- Attachments are first-class records related to **Task** only (covers both live project tasks and template tasks via the existing dual ownership of Task).
- Attachments are **not** added to comments, epics, sprints, or projects in this PRD.
- Inline images inside the TipTap description remain unchanged and are **not** migrated into the attachments list; the two mechanisms coexist (description embeds vs Anexos).

### Storage

- Reuse **UploadThing** as the storage provider (already used for description images, template gallery, and feedback screenshots).
- Add a dedicated UploadThing file route for task attachments that allows the agreed MIME/extensions, **max 10MB per file**, and enforces auth (signed-in user). Server-side (or post-upload) checks must also enforce **max 5 attachments per task** and project/template membership before persisting the DB record.
- Persist at least: storage key, URL, original filename, display name, content type (or extension), size, uploader user id, task id, created/updated timestamps — following the existing url/key patterns used elsewhere (e.g. feedback screenshots / project images).
- On attachment delete, replace, or task delete: delete corresponding files via UploadThing server API (`UTApi`) so storage stays in sync.

### API / domain

- Expose task-attachment operations through the existing API layer (tRPC routers + Zod validation), consistent with task mutations.
- Operations: list by task, create/link after upload, rename display name, replace file, delete; task delete cascades attachment cleanup (DB cascade and storage cleanup in the same flow).
- Authorization: caller must be a member of the task’s project, or an authorized template editor when the task belongs to a template — same spirit as other task mutations.
- Any authorized member may mutate any attachment on that task (no “only uploader” restriction).

### Create-task temporary state

- In the create-task dialog, selected files are held in **client temporary state** until the task is successfully created.
- After create succeeds, the client uploads staged files (respecting remaining slots and size/type rules) and links them to the new task id.
- Failed uploads in that batch are reported individually; successful links remain.
- If the user closes the dialog without creating the task, staged files are discarded (no orphan uploads if upload only starts after create). Prefer uploading **after** task create to avoid orphaned storage objects when the user abandons create. If a future implementation uploads earlier, it must clean up abandoned temp uploads.

### UI

- Anexos section inside `TaskDialog` (create and edit): dropzone + list.
- List row: display name, file-type affordance, uploader identity, actions (preview when applicable, download, rename, replace, delete).
- No manual reorder UI; stable order by creation time.
- Markdown preview: modal or drawer with formatted Markdown rendering (read-only).
- Image preview: thumbnail and/or lightbox; still downloadable.
- PDF / `.doc` / `.docx`: download action only.

### Limits & validation

- Max **5** attachments per task.
- Max **10MB** per file.
- Allowed: `.md`, `.pdf`, `.doc`, `.docx`, `png`, `jpg`, `jpeg`, `webp`, `gif`.
- Rename validates non-empty display name; does not rename the blob key.
- Replace validates type/size like a new upload and swaps storage + metadata on the same attachment record.

### Schema

- New attachment model related to Task (one-to-many), with uploader relation to User.
- Cascade delete from Task → attachments in the database; application code also deletes storage objects on task delete and on single attachment delete/replace.

## Out of Scope

- Attachments on comments, epics, sprints, projects, or feedback (beyond existing screenshot flow).
- In-app editing of Markdown (preview only).
- In-app preview/rendering of PDF or Word documents.
- Manual reordering of attachments.
- Attachment version history / audit log beyond “who uploaded”.
- SVG (or other image types beyond the agreed list).
- Migrating existing TipTap-embedded images into Anexos.
- Virus/malware scanning beyond what UploadThing provides by default.
- Public/unauthenticated sharing links for attachments.
- Showing attachment counts on Kanban cards or backlog rows (can be a follow-up).
- Full-text search across attachment contents.

## Further Notes

- Primary use case is auxiliary reference files (e.g. a Markdown color palette for a CSS task), not storing the main task body as a file.
- Both mentors/PMs and mentees/students use the feature as project members (or template editors for templates).
- Prefer implementing storage cleanup carefully on replace and task delete to avoid orphaned UploadThing files — mirror patterns already used when removing template gallery images.
- Markdown preview should use a trusted Markdown renderer with sanitization appropriate for user-supplied content.
- Consider optimistic UI for rename/delete where it fits existing task-dialog patterns, but upload/replace should reflect real UploadThing completion.

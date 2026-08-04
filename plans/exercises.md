# Plan: Exercises (Trilhas e Desafios)

> Source PRD: `plans/prd-exercises.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes (student/public)**:
  - `/exercises` — catalog of published tracks
  - `/exercises/[trackSlug]` — track detail: cloneable repo URL, challenges listed Easy → Medium → Hard (then admin sort within difficulty), viewer progress when logged in
  - `/exercises/[trackSlug]/[challengeSlug]` — challenge detail: description, setup instructions, acceptance criteria, status/actions
- **Routes (admin)**:
  - Admin CRUD for tracks and challenges (under the existing admin area)
  - `/admin/exercise-reviews` — mentor queue, **separate** from `/admin/pr-reviews`
- **Schema / key models**:
  - `ExerciseTrack` — name, slug, description, cloneable GitHub repo URL, publish/archive state, sort order among tracks
  - `ExerciseChallenge` — belongs to one track; title, slug, difficulty (`EASY` | `MEDIUM` | `HARD`), description, setup instructions, acceptance criteria, sort order within difficulty, archive state
  - `UserChallengeProgress` — per user per challenge; status `NOT_STARTED` | `IN_PROGRESS` | `IN_REVIEW` | `APPROVED` | `CHANGES_REQUESTED`; relevant timestamps
  - `ExerciseReviewSubmission` — mentee-created review unit; GitHub PR URL; track context; links to one or more challenges; supports “PR updated” signal
  - Per-challenge decision on a submission (pending / approved / changes_requested), optional mentor comment, reviewer admin id, timestamps
- **Auth**:
  - Catalog list + track/challenge titles: public
  - Challenge full brief + Start: authenticated (`protectedProcedure`)
  - Request review + “I updated the PR”: `mentorshipProcedure` (ACTIVE mentorship hard gate; **no** credits fallback)
  - Mentor decisions + content CRUD: `adminProcedure` (any org admin)
- **Domain boundary**: new Exercises domain — do **not** reuse ProjectTemplate, Task, or existing task `PullRequestReview` records
- **Repo / GitHub**: one cloneable repo URL per track; platform stores/validates PR URL format only; no auto-clone, no test runner, no GitHub API sync
- **Notifications**: extend existing notification system with exercise-specific types (requested, PR updated, approved, changes requested)
- **Nav**: Exercises entry in the main menu; Exercise reviews entry in admin menu alongside existing PR reviews

---

## Phase 1: Catálogo + admin de conteúdo

**User stories**: 1, 2, 3, 4, 5, 6, 15, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 58, 66

### What to build

End-to-end content and browse path: schema for tracks and challenges, admin UI to create/edit/archive tracks (including cloneable repo URL) and challenges (brief fields, difficulty, order), and public pages to list tracks and open a track/challenge.

Visitors see published tracks and challenge titles/difficulty ordered Easy → Medium → Hard. Logged-in users see the track repo URL, clone guidance, and full challenge brief (description, setup, acceptance criteria). Empty catalog state is handled. Repos themselves stay outside the product — admin only pastes the URL.

### Acceptance criteria

- [x] `ExerciseTrack` and `ExerciseChallenge` exist with the agreed fields, slugs, difficulty enum, archive/publish state, and ordering
- [x] Admin can create, edit, and archive tracks (name, description, repo URL, order) via UI
- [x] Admin can create, edit, reorder (within difficulty), and archive challenges on a track via UI
- [x] Published catalog is available at `/exercises` for anonymous visitors
- [x] Track detail lists challenges by difficulty then sort order; shows cloneable repo URL and basic clone guidance for logged-in users
- [x] Challenge detail shows description, setup instructions, and acceptance criteria for logged-in users; public list still shows title + difficulty
- [x] Track without a usable repo URL is not presented as cloneable (validation / UI guard)
- [x] Empty state when no published tracks exist
- [x] Archived tracks/challenges are hidden from the default public catalog but retained in the database

---

## Phase 2: Começar + progresso

**User stories**: 7, 10, 11, 12, 13

### What to build

Per-user progress on challenges. A logged-in user (with or without mentorship) can press **Start** on a not-started challenge; status becomes In progress and is visible on the track list and challenge detail. Approved (and other) statuses are displayable once they exist; this phase focuses on Start + status surfaces without the review loop.

### Acceptance criteria

- [ ] `UserChallengeProgress` exists and is unique per user + challenge
- [ ] Start transitions `NOT_STARTED` → `IN_PROGRESS` for the authenticated user
- [ ] Track list and challenge detail show the viewer’s status when logged in
- [ ] Users without active mentorship can still Start and see progress
- [ ] Unauthenticated users cannot Start; mutation is rejected
- [ ] Status set includes at least the values needed for later phases (`NOT_STARTED`, `IN_PROGRESS`, `IN_REVIEW`, `APPROVED`, `CHANGES_REQUESTED`) even if only Start is exercised here

---

## Phase 3: Pedir review (PR multi-desafio) + gate de mentoria

**User stories**: 8, 9, 14, 16, 17, 18, 19, 20, 52, 55, 56, 57

### What to build

Mentees with ACTIVE mentorship can request review by submitting a GitHub PR URL and selecting one or more challenges from that track. Selected challenges move to In review. Users without mentorship see a clear blocked CTA (no credits path). Multiple open reviews across challenges/tracks are allowed, subject to one active cycle per challenge (enforced fully in Phase 6; this phase must not create obvious duplicates for already In review / Changes requested challenges).

### Acceptance criteria

- [ ] `ExerciseReviewSubmission` (and per-challenge links/decisions) can be created with PR URL + selected challenge ids on one track
- [ ] Request review requires ACTIVE mentorship; otherwise fails with a clear error and UI explains the gate
- [ ] No credits fallback when mentorship is inactive
- [ ] PR URL is validated as a GitHub pull request URL (format only)
- [ ] Only challenges belonging to that track can be selected
- [ ] Successful request moves each selected challenge’s progress to `IN_REVIEW`
- [ ] Mentee can have reviews open on multiple challenges at once (different submissions or multi-select as designed)
- [ ] Domain remains separate from task `PullRequestReview`

---

## Phase 4: Fila do mentor + decisão por desafio

**User stories**: 28, 29, 30, 31, 32, 33, 34, 35, 36, 53, 59, 61

### What to build

Dedicated admin queue at `/admin/exercise-reviews` listing submissions that need attention. Mentor opens a submission, sees all covered challenges and the PR link, and can **Approve** or **Request changes** per challenge with an optional comment. Student status updates immediately; optional comments are visible on the student side. Any admin can act. Empty queue state is handled.

### Acceptance criteria

- [ ] `/admin/exercise-reviews` lists pending exercise submissions separately from `/admin/pr-reviews`
- [ ] Queue shows track, challenge(s), student, PR link, and useful timestamps
- [ ] Submission detail shows each linked challenge with individual status
- [ ] Admin can approve one challenge and request changes on another on the same submission
- [ ] Optional mentor comment is stored and shown to the mentee
- [ ] Decisions update `UserChallengeProgress` to `APPROVED` or `CHANGES_REQUESTED` immediately
- [ ] Only admins can perform decisions; non-admins are rejected
- [ ] Empty queue state is clear
- [ ] PR opens via external GitHub link from the queue/detail

---

## Phase 5: “Atualizei o PR” + aprovações parciais

**User stories**: 24, 25, 26, 27, 63

### What to build

When challenges on a submission are in Changes requested, the mentee updates the **same** PR on GitHub and clicks **I updated the PR** in the UI (optional short note). Those challenges return to In review; challenges already Approved on that submission stay Approved. Admins see the submission as needing re-review for the non-approved challenges.

### Acceptance criteria

- [ ] Mentee with ACTIVE mentorship can notify PR update on a submission that has at least one `CHANGES_REQUESTED` challenge
- [ ] Notify moves only linked challenges in `CHANGES_REQUESTED` back to `IN_REVIEW`
- [ ] Approved challenges on that submission remain `APPROVED`
- [ ] Optional note from the mentee is stored/visible to the mentor on re-review
- [ ] Submission reappears in the mentor queue for the challenges still needing review
- [ ] Notify is blocked without ACTIVE mentorship

---

## Phase 6: Re-review pós-aprovado + regra de ciclo ativo

**User stories**: 21, 22, 62

### What to build

After a challenge is Approved, the mentee may request review again (new cycle). Enforce at most one active non-terminal cycle per challenge (`IN_REVIEW` or `CHANGES_REQUESTED`) so mentor state does not fork. Starting a new cycle after Approved returns progress to In review under the new submission context.

### Acceptance criteria

- [ ] Mentee can request review again for an `APPROVED` challenge (mentorship still required)
- [ ] New request moves that challenge to `IN_REVIEW` for the new cycle
- [ ] System rejects adding a challenge that already has an active `IN_REVIEW` or `CHANGES_REQUESTED` cycle to another conflicting open submission
- [ ] Error messaging is clear when a conflicting review is attempted

---

## Phase 7: Notificações

**User stories**: 37, 38, 39, 40, 41

### What to build

Wire exercise review lifecycle into the existing notification system: admins notified on new review requests and on “PR updated”; mentees notified on approve and on changes requested. Behavior should feel consistent with existing project PR review notifications.

### Acceptance criteria

- [ ] Admins receive a notification when a mentee requests an exercise review
- [ ] Admins receive a notification when a mentee marks a PR as updated
- [ ] Mentee receives a notification when a challenge is approved
- [ ] Mentee receives a notification when changes are requested on a challenge
- [ ] Notification types/links land the user on the relevant exercises or admin queue surface

---

## Phase 8: Edge cases de ciclo de vida

**User stories**: 44, 46, 64, 65, 60

### What to build

Harden lifecycle: archived tracks/challenges stay out of the default catalog, but in-flight reviews can still be completed by admins. If mentorship becomes inactive while a review is pending, the mentee can still see history/in-flight state, but new review requests and “PR updated” remain blocked until ACTIVE again. Polish primary CTAs (clone, Start, Request review, I updated the PR) for clarity.

### Acceptance criteria

- [ ] Archiving a track or challenge hides it from the default public catalog
- [ ] Admins can still finish open reviews for archived track/challenge content
- [ ] Historical/in-flight progress remains visible to the mentee after archive where applicable
- [ ] When mentorship lapses, mentee can still view existing in-flight/historical exercise review state
- [ ] When mentorship lapses, new review requests and “PR updated” are rejected until ACTIVE
- [ ] Admins can still close in-flight reviews while the mentee’s mentorship is inactive
- [ ] Primary student CTAs are clear for the happy path (clone, Start, Request review, I updated the PR)

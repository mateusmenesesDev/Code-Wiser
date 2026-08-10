# Plan: Planning Poker Transition Polish

> Source PRD: `plans/prd-planning-poker-transition.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes**: No new routes. Handoffs stay on the existing Planning Poker room URL; session end still returns to the project workspace route.
- **Schema**: No database schema changes. Session still advances via `currentTaskIndex` over `taskIds[]`; story points still persist on the task.
- **Key models**: Planning Poker session, session votes, task (for current/next story display), realtime `task-finalized` / session-ended events.
- **Auth**: Unchanged — only creator / org admin finalizes; all room members receive handoff and session-complete UX via realtime.
- **Loading model**: Distinguish cold load (no prior room content) from in-session transition (previous content exists). Full-screen session loader is cold-load only.
- **Prefetch policy**: Prefetch only the immediate next task id (`taskIds[currentTaskIndex + 1]`), as soon as the current task is known; refresh after each successful advance.
- **Closing UX**: Last-task finalize shows a short shared “Session complete” state to everyone, then navigates to the workspace.
- **Motion**: Short intentional content transition between stories; respect reduced-motion preferences where the product already does.

---

## Phase 1: Hold the room during handoff

**User stories**: 1, 2, 5, 6, 15, 19, 23, 24, 28

### What to build

Make in-session story advances keep the Planning Poker room mounted. When the mentor finalizes (or participants receive `task-finalized`), the UI must not flip into a full-screen “Loading session...” state just because the next task query has not resolved yet. Previous results stay visible until the next story is ready, and mentor mutation success plus realtime handling must not race into a double-reset that clears results onto the old story’s voting UI. Cold load of the room with no prior content may still show a normal full-screen loader.

### Acceptance criteria

- [ ] Advancing from one story to the next never shows the full-screen session loader for mentor or participants
- [ ] Previous results remain visible until the next story is ready (no brief return to voting cards on the old story)
- [ ] Room chrome (header, members, progress shell) stays mounted during handoff
- [ ] Cold load / first paint with no prior content still shows a normal loading state
- [ ] Vote refetch for the new story does not unmount the room
- [ ] Mentor mutation success and realtime `task-finalized` coordinate as a single clean handoff

---

## Phase 2: Pending finalize + subtle status

**User stories**: 3, 4, 14, 17, 18, 22

### What to build

Add an explicit in-room handoff state. While advancing, everyone sees a subtle status such as “Moving to next story…”. The mentor’s finalize control stays disabled/pending until the next story is ready to vote on. Failed finalize attempts restore an interactive finalize UI; a stalled or failed advance must not leave participants stuck on the status forever. Creator and org-admin mentors get the same pending behavior.

### Acceptance criteria

- [ ] During handoff, all members see a subtle in-room status (e.g. “Moving to next story…”)
- [ ] Mentor finalize control remains disabled/pending until the next story is ready for voting
- [ ] Failed finalize restores an interactive finalize UI without a full refresh
- [ ] Handoff status does not remain stuck if the advance fails or is interrupted
- [ ] Org-admin mentors receive the same pending finalize behavior as the session creator

---

## Phase 3: Prefetch next task

**User stories**: 8, 9, 10, 26

### What to build

As soon as the current task is known and a next task exists in the session list, prefetch that next task on mentor and participant clients. After each successful advance, prefetch the new next task. Mid-session joiners should also prefetch the upcoming task when one exists. Do not prefetch the entire remaining list.

### Acceptance criteria

- [ ] When current task is known and a next task id exists, that next task is prefetched
- [ ] After a successful advance, the new next task is prefetched
- [ ] Participants and mid-session joiners also prefetch the upcoming task when one exists
- [ ] Only the immediate next task is prefetched (not all remaining tasks)
- [ ] Prefetch measurably reduces or eliminates wait on typical advances (handoff rarely blocked on cold task fetch)

---

## Phase 4: Short story transition animation

**User stories**: 7, 16, 27

### What to build

When the next story is ready, swap into the new voting UI with a short intentional animation on the story/voting content region (not a full-page reload effect). Progress context updates as part of that transition. Motion should feel like polish, not delay, and should respect reduced-motion preferences if the product already supports that.

### Acceptance criteria

- [ ] Next story appears via a short intentional content transition (e.g. fade/soft crossfade)
- [ ] Animation is scoped to the story/voting region, not the entire page
- [ ] Progress indicator updates coherently with the transition to the next story
- [ ] Reduced-motion preferences are respected when applicable
- [ ] Transition duration is brief enough to read as polish, not waiting

---

## Phase 5: Session complete closing flow

**User stories**: 11, 12, 13, 25 (voting unchanged: 20, 21)

### What to build

When the last story is finalized, show a short shared “Session complete” state to everyone in the room via realtime, then navigate back to the workspace without a full-screen loading flash. The last-task confirm path should enter this closing experience instead of racing an immediate hard navigation. Voting, vote changes, and results-reveal rules remain unchanged outside this closing polish.

### Acceptance criteria

- [ ] Finalizing the last story shows a short “Session complete” state before leaving
- [ ] All room members see the session-complete state (not only the mentor)
- [ ] Exit to workspace happens after the short complete state, without a full-screen loader flash
- [ ] Last-task confirm dialog flows into the shared closing experience
- [ ] End/finalize pending behavior remains clear and does not allow confusing double-submit during close
- [ ] Voting and results-reveal behavior for non-final stories remain unchanged

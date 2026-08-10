## Problem Statement

In Planning Poker, after all members have voted and the mentor sets the final story point and confirms, the room briefly flashes a full-screen “Loading session...” state while advancing to the next story. The flash is short enough that it feels like a glitch rather than intentional feedback. The same jank can appear for every participant when the realtime `task-finalized` event advances the session, and again when the last story is finalized and the session ends.

From the user’s perspective, confirming a story point should feel like a calm, deliberate handoff to the next story — not a blink of a loading screen.

## Solution

Smooth the Planning Poker handoff between stories (and into session completion) so the room never unmounts into a full-screen loader during an in-session transition.

Specifically:

1. **Stop treating “next task not loaded yet” as a full session load.** Keep the room chrome and previous content mounted while the next story becomes ready.
2. **Show a subtle in-room status** (e.g. “Moving to next story…”) to everyone during the handoff.
3. **Keep the mentor’s finalize control disabled/pending** until the next story is ready to vote on.
4. **Prefetch the next task** as soon as the current task is known, so the handoff is usually instant.
5. **Use a short intentional transition animation** when swapping from the previous story/results to the next voting UI.
6. **On the last story**, show a short shared “Session complete” state to everyone, then navigate back to the workspace — without a loading flash.

Initial cold load of the Planning Poker page may still use a full-screen loader; that is not the bug this PRD addresses.

## User Stories

1. As a mentor, I want to finalize a story’s points and move to the next story without seeing a full-screen loading flash, so that the flow feels polished and trustworthy.
2. As a participant, I want the same smooth handoff when the mentor finalizes a story, so that I don’t experience a brief glitch when the room advances.
3. As a mentor, I want the finalize button to stay disabled/pending until the next story is fully ready, so that I have clear feedback that work is in progress without a disruptive loader.
4. As a participant, I want a subtle status message while the room advances (e.g. “Moving to next story…”), so that I understand why the UI is momentarily held.
5. As a mentor, I want the previous story/results to remain visible until the next story is ready, so that the screen doesn’t jump back to voting cards on the old story.
6. As a participant, I want the previous results to remain visible until the next story is ready, so that I don’t briefly see the old story’s voting UI again.
7. As a Planning Poker user, I want a short intentional animation when the next story appears, so that the transition feels deliberate rather than abrupt or buggy.
8. As a Planning Poker user, I want the next upcoming task in the session to be prefetched as soon as the current task is known, so that advancing rarely waits on a network fetch.
9. As a mentor, I want prefetch to refresh for the new “next” task after each successful advance, so that every handoff stays ready.
10. As a participant, I want my client to also benefit from prefetch of the next task, so that realtime advances are smooth for everyone in the room.
11. As a mentor, when I finalize the last story, I want to see a short “Session complete” state before leaving, so that ending the session feels intentional.
12. As a participant, when the last story is finalized, I want to see the same short “Session complete” state before returning to the workspace, so that everyone shares the closing moment.
13. As a Planning Poker user, I want the session-complete state to avoid full-screen loading flashes during exit, so that closing the session feels as polished as advancing between stories.
14. As a mentor, I want finalize and end-session actions to remain clearly pending during the closing flow, so that I don’t double-submit or wonder if the action worked.
15. As a Planning Poker user, I want the room layout (header, members, progress) to stay mounted during handoffs, so that only the story/voting content transitions.
16. As a Planning Poker user, I want the progress indicator to update as part of the intentional transition to the next story, so that context stays coherent.
17. As a mentor, I want failed finalize attempts to restore an interactive finalize UI (no stuck pending state), so that I can retry without refreshing.
18. As a participant, I want a failed or interrupted advance to not leave me stuck on a permanent “Moving to next story…” status, so that the room recovers cleanly.
19. As a Planning Poker user, I want the initial page load of an active session to still show a normal loading state when there is no prior content, so that first entry remains clear.
20. As a mentor, I want changing my vote phase / results phase behavior to remain unchanged except for the handoff polish, so that voting itself is unaffected.
21. As a participant, I want voting, vote changes, and results reveal to keep working as today, so that only transition UX changes.
22. As an org admin mentor in the room, I want the same finalize handoff polish as the session creator, so that whoever can finalize gets the same experience.
23. As a Planning Poker user, I want realtime `task-finalized` handling to coordinate with local mutation success so the mentor doesn’t get a double flash or double reset, so that the handoff runs once cleanly.
24. As a Planning Poker user, I want empty votes for the new story to load without flipping the whole room into a session-level loader, so that vote refetch doesn’t cause flicker.
25. As a mentor, I want confirming the last task dialog to lead into the shared session-complete experience (not an immediate hard navigation flash), so that the last-task path matches the polished flow.
26. As a participant who joins mid-session, I want prefetch of the next task (when one exists) so that the next advance after I join is still smooth.
27. As a Planning Poker user, I want accessibility-friendly transitions (respect reduced-motion preferences where the app already does), so that animation doesn’t harm usability.
28. As a developer maintaining Planning Poker, I want loading for “no session/task on first paint” separated from “transitioning between known tasks,” so that future loading UX doesn’t regress into full-screen flashes.

## Implementation Decisions

- **Separate initial load from in-session transition.** Full-screen “Loading session...” remains only for true cold load / missing session. Advancing `currentTaskIndex` must not set a room-level `isLoading` that unmounts the room when the previous task was already shown.
- **Hold previous UI during handoff.** On finalize / `task-finalized`, do not clear results into the old story’s voting cards before the next task is ready. Keep prior results (or a held previous view) until the next task data is available, then run the transition.
- **Handoff status for everyone.** While transitioning between stories, show a subtle in-room status such as “Moving to next story…”. Mentor finalize control stays disabled/pending until the next story is ready for voting.
- **Prefetch next task only.** When the current task id is known and a next id exists in `session.taskIds[currentTaskIndex + 1]`, prefetch that task. After a successful advance, prefetch the new next task. Do not prefetch the entire remaining list.
- **Use mutation/realtime payload intentionally.** Prefer coordinating on finalize success / `task-finalized` (including next index / next task id when available) so clients can prepare the next view without a blank `currentTask` gap.
- **Short intentional content transition.** When swapping to the next story’s voting UI, use a brief enter/exit animation on the story/voting region (not the whole page). Keep it short so it reads as polish, not delay. Prefer a simple fade/soft crossfade; respect reduced-motion if the product already has that pattern.
- **Last-task closing flow for everyone.** Finalizing the last story shows a short shared “Session complete” state via the same realtime path, then navigates members back to the workspace. Avoid immediate hard navigation that races loaders; avoid full-screen loading flash during exit.
- **Pending states over flash loaders.** Prefer button/dialog pending + subtle status over replacing the room with a spinner for finalize, advance, and end-session.
- **Mentor double-path coordination.** Mutation `onSuccess` and Pusher `task-finalized` should not cause competing resets that widen the empty-task window. Treat handoff as a single coordinated transition state.
- **Votes for the new task.** Refetch/subscribe votes for the new task as part of the handoff, but never gate the entire room on votes being present for the new story.
- **Scope of modules.** Planning Poker room UI, Planning Poker client hook/state machine, task query prefetch usage, and finalize/end-session realtime handling. Server finalize contract may expose/clarify next task identity if needed for cleaner client coordination; no broader poker redesign.
- **Copy defaults.** Handoff: “Moving to next story…”. Closing: “Session complete” (short-lived, then leave). Exact microcopy can be tuned in implementation as long as tone stays calm and non-alarming.

## Out of Scope

- Redesigning voting cards, results reveal rules, or who is allowed to finalize.
- Changing Fibonacci values, vote aggregation, or story point persistence rules.
- Prefetching all remaining session tasks (only the immediate next task).
- Adding route-level Suspense/`loading.tsx` for Planning Poker.
- Changing how sessions are created or how members join presence.
- Broader realtime infrastructure changes beyond what’s needed for a clean handoff/session-complete signal.
- Visual redesign of the Planning Poker room beyond transition/status/pending polish.

## Further Notes

- Root cause today: room `isLoading` is effectively `!session || !currentTask`. When the session index advances, the next `task.getById` often has no cache yet, so `currentTask` briefly becomes null and the full-screen loader mounts.
- Secondary glitch today: local state clears `showResults` before the session index advances, which can briefly show voting UI for the old story.
- Success looks like: finalize → held UI + subtle status + pending control → short animated swap to next story (or short “Session complete” then workspace), with no full-screen loader blink for mentor or participants.

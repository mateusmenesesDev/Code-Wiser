# PRD: Exercises (Trilhas e Desafios)

## Problem Statement

Alunos da mentoria precisam praticar habilidades em trilhas técnicas (React, JavaScript, TypeScript, lógica de programação, Next.js, Python) com desafios concretos, repos clonáveis e testes já prontos. Hoje a plataforma só oferece aprendizado via Project Templates / Workspace e review de PR ligado a tasks de projeto — não há um catálogo público de exercícios por trilha, nem um fluxo em que o aluno marque um desafio para review e o mentor aprove ou peça mudanças por desafio.

Sem isso, a prática fica espalhada fora do produto: o aluno não vê progresso claro por trilha na mentoria, e o mentor não tem uma fila dedicada para revisar esses desafios.

## Solution

Criar um **domínio novo de Exercises**, independente de Project Templates e do PR review de tasks.

A plataforma passa a expor:

- **Trilhas** (seções) — ex.: React, JavaScript, TypeScript, Lógica de programação, Next.js, Python — cada uma com um **único repo GitHub clonável** contendo todos os desafios daquela trilha (código + testes).
- **Desafios** dentro de cada trilha, listados por dificuldade (Fácil → Médio → Difícil), com enunciado, instruções de setup e critérios de aceite na plataforma.
- Fluxo do aluno: **Começar** → trabalhar no repo clonado → **pedir review** informando URL do PR e quais desafios o PR cobre → acompanhar status.
- Fluxo do mentor (qualquer admin): fila **separada** da de PR reviews de projetos; pode aprovar ou pedir mudanças **por desafio** no mesmo PR, com comentário opcional.
- Em mudanças solicitadas, o aluno atualiza o **mesmo PR** e usa um botão na UI para informar a atualização e voltar para review.

O catálogo (trilhas + lista de desafios) é **público**. Pedir review exige mentoria **ACTIVE**. A plataforma não clona o repo automaticamente, não roda testes e não integra GitHub API além de armazenar/validar a URL do PR — o mentor revisa o código no GitHub.

Admin cria e gerencia trilhas, URL do repo e desafios via UI. Os repos em si (implementação + testes) ficam fora da plataforma; o admin apenas cola o link.

## User Stories

### Catálogo público e navegação

1. As a visitor, I want to open an Exercises page and see the available tracks, so that I understand what skill paths the mentorship offers.
2. As a visitor, I want to open a track and see its challenges listed by difficulty (Easy, then Medium, then Hard), so that I can gauge the progression without being gated.
3. As a visitor, I want to see each challenge’s title and difficulty, so that I can browse the curriculum before signing up.
4. As a visitor, I want challenge detail content (full statement) to remain available according to product rules for logged-in users, while the public list still shows tracks and challenges, so that the catalog is useful without requiring an account for discovery.
5. As a logged-in user, I want to open a track and see the cloneable repository URL for that track, so that I can clone one repo and work on all of its challenges.
6. As a logged-in user, I want to open a challenge and read its description, setup instructions, and acceptance criteria, so that I know what to implement and how the mentor will evaluate me.
7. As a logged-in user without active mentorship, I want to browse tracks, read challenge details, and start challenges, so that I can practice even before reviewing.
8. As a logged-in user without active mentorship, I want the “request review” action to be clearly blocked with an explanation that active mentorship is required, so that I know how to unlock reviews.
9. As a mentee with active mentorship, I want full access to start challenges and request reviews, so that I can complete the exercise loop end-to-end.

### Progresso do aluno

10. As a logged-in user, I want each of my challenges to have a status among Not started, In progress, In review, Approved, and Changes requested, so that I can see where I am in the flow.
11. As a logged-in user, I want a “Start” button on a challenge I have not started, so that it moves to In progress when I begin work.
12. As a logged-in user, I want my per-challenge status visible on the track list and on the challenge detail, so that I do not lose track of approvals across the track.
13. As a mentee, I want to see which challenges in a track are approved, so that I know I passed those challenges (e.g. “passed React challenge 1”).
14. As a mentee, I want to work on multiple challenges and have multiple reviews open at once (same or different tracks), so that I am not blocked waiting on a single mentor decision.
15. As a mentee, I want challenge order inside a track to be listing-only by difficulty, with no requirement to approve challenge N before reviewing N+1, so that I can choose what to tackle.

### Pedido de review (PR)

16. As a mentee with active mentorship, I want to request review by submitting a GitHub PR URL and selecting one or more challenges from that track that the PR covers, so that one PR can map to several exercises.
17. As a mentee, I want the system to reject review requests when mentorship is not ACTIVE, so that review capacity stays tied to mentorship.
18. As a mentee, I want validation that the PR URL looks like a GitHub pull request URL, so that mentors get usable links.
19. As a mentee, I want only challenges that belong to the track of the repo (and that I am allowed to submit) to be selectable for that review, so that I cannot attach unrelated challenges.
20. As a mentee, I want requesting review to move each selected challenge to In review, so that my status reflects the submission.
21. As a mentee, I want to request review again for an already Approved challenge, so that I can resubmit improved work if needed.
22. As a mentee, when I resubmit an approved challenge for review, I want its status to return to In review under the new (or updated) submission context, so that the mentor queue shows it again.
23. As a mentee, I want to see the PR URL associated with my in-review or changes-requested challenges, so that I can reopen the same PR easily.

### Atualização após mudanças solicitadas

24. As a mentee, when one or more of my challenges are in Changes requested for a given PR, I want to update that same PR on GitHub and click an “I updated the PR” button in the UI, so that I do not need a new PR.
25. As a mentee, when I confirm a PR update, I want every challenge linked to that submission that is in Changes requested to move back to In review, so that the mentor knows there is new work to look at.
26. As a mentee, I want challenges on the same PR that were already Approved to stay Approved when I notify an update for the remaining ones, so that partial approvals are preserved.
27. As a mentee, I want optional room to leave a short note when notifying a PR update, so that I can point the mentor at what changed.

### Fila e decisões do mentor

28. As an admin (mentor), I want a dedicated Exercises review queue separate from project task PR reviews, so that exercise reviews do not mix with workspace PR reviews.
29. As an admin, I want to see pending exercise review items with track, challenge(s), student, PR link, and timestamps, so that I can triage the queue.
30. As an admin, I want to open a submission and see all challenges covered by that PR with their individual statuses, so that I can decide per challenge.
31. As an admin, I want to Approve a specific challenge on a multi-challenge PR while Requesting changes on another challenge on the same PR, so that partial credit/progress is possible.
32. As an admin, I want Approve and Request changes to accept an optional comment, so that I can leave platform feedback without being forced to write one.
33. As an admin, I want my decision to update the student’s challenge status immediately, so that the student sees Approved or Changes requested in the product.
34. As an admin, I want any org admin to be able to review any exercise submission, so that we do not need per-student mentor assignment for v1.
35. As an admin, I want to open the GitHub PR from the queue, so that I can review the actual code and tests there.
36. As an admin, when a student notifies that the PR was updated, I want that submission to reappear as needing review for the challenges still not approved, so that I do not miss re-reviews.

### Notificações

37. As a mentee, I want a notification when a mentor approves one of my challenges, so that I know I passed it.
38. As a mentee, I want a notification when a mentor requests changes on one of my challenges, so that I know to update the PR.
39. As an admin, I want a notification when a mentee requests an exercise review, so that I can pick it up from the queue.
40. As an admin, I want a notification when a mentee marks a PR as updated after changes requested, so that I know to re-review.
41. As a mentee and as an admin, I want these notifications to follow the same general notification patterns already used for project PR reviews, so that behavior feels consistent.

### Admin: gestão de trilhas e desafios

42. As an admin, I want to create a track with a name, description, and cloneable GitHub repository URL via the admin UI, so that new skill paths can be added without code changes.
43. As an admin, I want to edit a track’s name, description, repo URL, and visibility/archive state, so that catalog content stays current.
44. As an admin, I want to archive a track so it no longer appears in the public catalog by default, while preserving historical student progress, so that we can retire paths safely.
45. As an admin, I want to create challenges inside a track with title, difficulty (Easy / Medium / Hard), description, setup instructions, and acceptance criteria, so that the platform holds the learning brief.
46. As an admin, I want to edit and archive challenges, so that outdated exercises can be maintained without deleting history.
47. As an admin, I want challenges within a track to be listed by difficulty (Easy, then Medium, then Hard), and within the same difficulty by a stable admin-defined order, so that the sequence is predictable.
48. As an admin, I want to reorder challenges within the same difficulty when needed, so that “challenge 1, 2, 3…” reading order matches pedagogy.
49. As an admin, I want the repository itself (starter code and tests) to remain outside the product — I only paste the repo URL on the track — so that challenge authoring in Git stays the source of truth for runnable work.
50. As an admin, I want initial tracks to include React, JavaScript, TypeScript, Lógica de programação, Next.js, and Python (creatable via UI, not hard-coded forever), so that the mentorship launch set is covered.
51. As an admin, I want validation that a track has a repository URL before it is shown as cloneable in the student UI, so that students are not sent to a missing repo.

### Permissões e regras de negócio

52. As the system, I want exercise review mutations to require authenticated users with ACTIVE mentorship, so that free/public browsing does not consume mentor time.
53. As the system, I want exercise review decisions (approve / request changes) to require admin privileges, so that only mentors can change official pass status.
54. As the system, I want “Start” and reading challenge content (for logged-in users) to work without mentorship, so that practice is open and review is the gated step.
55. As the system, I want exercise reviews to never charge credits as a fallback when mentorship is inactive — mentorship ACTIVE is a hard requirement — so that the product rule stays simple.
56. As the system, I want this feature to be a new domain, not reused ProjectTemplate / Task / existing PullRequestReview records, so that project workflows and exercise workflows do not couple.
57. As a mentee, I want unauthorized review attempts to fail with a clear error, so that I understand mentorship is required.

### UX e estados vazios

58. As a visitor, I want an empty state when no tracks are published yet, so that the Exercises page does not look broken.
59. As a mentee, I want an empty mentor-facing message when I have no submissions, and as an admin I want an empty queue state, so that both sides understand idle states.
60. As a mentee, I want clear CTAs: clone repo, Start, Request review, I updated the PR, so that the happy path is obvious.
61. As a mentee, I want to see mentor optional comments on approve / changes requested on the challenge or submission detail, so that platform feedback is visible even if GitHub review comments also exist.

### Edge cases

62. As a mentee, if I try to include an already In review challenge in a new submission incorrectly, I want the system to prevent conflicting open reviews or define a single active submission per challenge, so that mentor state does not fork ambiguously.
63. As a mentee, when only some challenges on my PR were changes-requested, I want “I updated the PR” to re-queue only those, leaving Approved ones untouched.
64. As an admin, if a track or challenge is archived while a review is open, I want to still finish that review, so that in-flight work is not stranded.
65. As a mentee, if my mentorship becomes inactive while a review is pending, I want existing in-flight reviews to remain visible, but new review requests and “PR updated” notifications to be blocked until mentorship is ACTIVE again, so that gating stays consistent.
66. As a mentee, I want to open the track repo link in a new tab with standard clone instructions shown in the UI, so that I know to `git clone` locally and run the bundled tests myself.

## Implementation Decisions

### Domain (new)

- Introduce a first-class **Exercise** domain separate from Project Templates, Projects, Tasks, and existing task `PullRequestReview`.
- Core concepts:
  - **Track** (trilha / seção): name, description, cloneable GitHub repo URL, publish/archive state, ordering among tracks.
  - **Challenge** (desafio): belongs to one Track; title; difficulty enum Easy | Medium | Hard; description; setup instructions; acceptance criteria; sort order within difficulty; archive state.
  - **UserChallengeProgress**: per user per challenge; status NotStarted | InProgress | InReview | Approved | ChangesRequested; timestamps for started/reviewed; latest decision metadata as needed.
  - **ExerciseReviewSubmission**: a review unit created by a mentee; holds GitHub PR URL; belongs to a track context; links to one or more challenges; supports mentor per-challenge decisions and student “PR updated” signal.
  - **ExerciseReviewDecision** (or equivalent join): per challenge within a submission — pending / approved / changes_requested, optional mentor comment, reviewer admin id, timestamps.

### Listing and difficulty

- Challenges in a track are listed Easy → Medium → Hard; within the same difficulty, use admin-defined sort order.
- No progression lock: any listed challenge can be started or submitted for review regardless of other approvals.

### Student flow

- **Start** transitions NotStarted → InProgress.
- **Request review** (mentorship ACTIVE): create/update an ExerciseReviewSubmission with PR URL + selected challenge ids; those challenges → InReview.
- One PR may cover multiple challenges; the student must declare which challenges the PR covers.
- Mentor may approve challenge A and request changes on challenge B on the same submission.
- **Changes requested**: student updates the same PR on GitHub, then clicks **I updated the PR**; all challenges on that submission still in ChangesRequested return to InReview; Approved challenges on that submission stay Approved.
- **Approved** challenges may be submitted for review again later (new cycle allowed).
- Multiple open reviews across challenges/tracks are allowed; enforce a clear rule that a challenge has at most one active non-terminal review cycle at a time (InReview or ChangesRequested), to avoid duplicate mentor work — except that after Approved, a new cycle may start.

### Access

- Public: tracks + challenge list (catalog).
- Logged-in without mentorship: can read details and Start; cannot request review or notify PR updates.
- Mentorship ACTIVE: required hard gate for review request and “PR updated”; no credits fallback.
- Mentor actions: any user with existing admin/`org:admin` privileges.

### Mentor UX

- New admin queue for exercise reviews, separate from `/admin/pr-reviews` (project/task PRs).
- Queue shows submissions needing attention (new requests and updated-after-changes).
- Detail allows per-challenge Approve / Request changes with optional comment and link out to GitHub PR.

### Admin content UI

- CRUD for tracks (including repo URL) and challenges (all brief fields + difficulty + order).
- Archive rather than hard-delete when progress/reviews exist.
- GitHub repositories (code + tests) are authored outside the app; platform only stores the track repo URL.

### Notifications

- Notify admins on: exercise review requested; PR marked updated.
- Notify mentee on: challenge approved; changes requested.
- Reuse the existing notification system patterns/types extended for this domain.

### Technical clarifications

- Validate PR URLs as GitHub pull request URLs (format validation only in v1).
- No automatic clone/fork, no CI/test runner in the platform, no GitHub API sync of review state.
- Exercises feature lives in the current application as a new module/API surface (routers, schema, UI pages for catalog, challenge detail, admin CRUD, mentor queue) — not bolted onto template enrollment.
- Initial track set expected via admin UI: React, JavaScript, TypeScript, Lógica de programação, Next.js, Python (each with its own cloneable repo).

### API / module shape (conceptual)

- Public/protected queries: list tracks, track detail with challenges + viewer progress, challenge detail.
- Protected mutations: start challenge.
- Mentorship-gated mutations: request review; notify PR updated.
- Admin mutations: track/challenge CRUD and ordering; approve challenge; request changes on challenge.
- Admin queries: exercise review queue and submission detail.

## Out of Scope

- Automatic cloning, forking, or provisioning of GitHub repos for students.
- Platform execution of challenge tests or CI status checks.
- GitHub API integration beyond storing/validating the PR URL (no sync of GitHub review comments, checks, or commits).
- Assigning a specific mentor to a student or track (any admin reviews).
- Reusing or migrating ProjectTemplate / Task / existing PullRequestReview into this domain.
- Credits-based payment for exercise reviews when mentorship is inactive.
- Locking challenge N+1 behind approval of challenge N.
- Student-authored challenges or community submissions.
- Mobile-native apps; email digests specific to exercises beyond existing notification channels.
- AI-assisted review of exercise PRs (may be considered later alongside other code-review AI ideas).

## Further Notes

- “Lógica de programação” is the product name for the LeetCode-style track; avoid exposing “LeetCode” as the track brand unless marketing decides otherwise.
- All challenges of a track live in **one** cloneable repo; the platform lists challenges individually with progress/review, while the runnable work and tests live in that repo’s layout (convention owned by whoever maintains the repo, not enforced by the app in v1).
- Closest existing product analogy for notifications and mentor triage is the task PR review flow, but data model and admin queue must remain separate to avoid mixing project work with skill-track exercises.
- When mentorship lapses mid-review: keep historical/in-flight visibility for the mentee; block new review requests and “PR updated” until ACTIVE again (admins may still close in-flight reviews).
- Partial approval on multi-challenge PRs is a core v1 behavior — UI for both student and mentor must make per-challenge status obvious on a shared PR.

# AI-assisted pull-request review

P2.2 is a bounded assistant for project pull-request reviews. It never changes the review decision; an admin must accept, edit, or discard findings and then request changes or approve through the existing lifecycle.

## Runtime limits

- The queue processes at most two analyses per cron invocation, sequentially.
- An analysis has at most two attempts and the model call has no SDK retries.
- Each model call has a 30-second timeout.
- At most 40 files and 50,000 patch characters are submitted; each patch is capped at 10,000 characters.
- At most 20 findings are persisted.
- Binary files, generated/build directories, dependency directories, and likely secret files/lines are excluded or redacted.

The queue is claimed with a conditional database update, so overlapping cron invocations cannot process the same analysis concurrently.

## Data and retention

The worker fetches the pull-request diff using the read-only GitHub App installation token. It does not persist raw diffs, repository files, prompts, or provider output. It persists only the input hash, size/truncation metrics, provider/model/prompt version, token usage, sanitized failure information, and structured findings.

Each analysis is pinned to the GitHub head SHA. A webhook update makes an older analysis stale; findings from a different SHA cannot be completed or sent to the learner.

## Trust and human decision

Task text, project text, filenames, and code are untrusted data and are explicitly delimited in the model prompt. Pull-request comments are not sent to the model in this version. Returned file paths are validated against the submitted diff.

Findings are visible only to admins. The learner receives feedback only through the existing mentor decision flow, after the mentor has written or accepted the feedback. Approval is never automated. When AI findings contribute to a changes-requested decision, the review is marked as AI-assisted for disclosure.

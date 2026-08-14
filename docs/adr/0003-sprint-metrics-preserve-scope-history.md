# Sprint metrics preserve commitment and scope history

---
status: accepted
---

Sprint reporting preserves the points committed when a Sprint starts separately from its current scope. Burndown compares the original ideal with the current remaining work and records scope or estimate changes; velocity counts only points on items that are DONE when the Sprint closes. This was chosen over recalculating totals or reconstructing old charts because honest planning feedback matters more than a cleaner-looking metric.

## Consequences

- Scope and estimate changes need structured history with the item, old and new values, change type, and author.
- Burndown data is collected daily from Sprint start; older Sprints do not receive fabricated history.
- The dashboard must distinguish committed, current, completed, remaining, and unestimated work.

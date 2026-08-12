# Credits and payments

Credits have two representations:

- `User.credits` is the current balance projection used by the product.
- `CreditTransaction` is the append-only ledger. Every new purchase, consumption, refund and admin adjustment updates both representations in one database transaction.

The ledger value is signed: purchases, refunds and positive admin adjustments are positive; project, invitation and PR-review consumption are negative. A debit is conditional on the current balance, so concurrent requests cannot make a balance negative.

## Idempotency

Every operation has a stable idempotency key. Reusing the same key with the same operation returns the existing ledger transaction without changing the balance. Reusing it with different user, value, source or reference is a conflict.

- Stripe checkout: `stripe:checkout:<checkout-session-id>`
- Project creation: `project:create:<client-request-id>`
- Project invitation: `project:invitation:<invitation-id>`
- PR review: `pr-review:<client-request-id>`
- Admin adjustment: `admin-adjustment:<client-request-id>`
- Refunds: `refund:<operation>:<source-id>`

Project creation and PR review clients retain their request UUID while retrying an uncertain request. Stripe uses the checkout session ID because completed and asynchronous-success events can have different event IDs for one payment.

## Stripe processing

`src/app/api/webhooks/stripe/route.ts` verifies the raw payload signature, ignores unpaid checkout sessions, resolves credit quantities from the application allowlist of Stripe price IDs, aggregates all line items, records `StripeWebhookEvent.event.id`, and applies one purchase transaction. Event insertion and balance projection are atomic; a failed handler leaves no processed-event row so Stripe can retry.

Subscription events use the same processed-event table. Monetary refunds and chargebacks are not credit refunds; they require a separate product policy.

## Legacy project payment evidence

`ProjectCreditPaymentEvidence` remains as a compatibility record for cancellation and member-removal refund eligibility. New project and invitation debits link it to their `CreditTransaction`. Older evidence and accepted invitations without evidence continue through the legacy refund path until their entitlements are retired.

The ledger migration captures each existing positive `User.credits` balance as one deterministic opening adjustment. It cannot reconstruct historical Stripe purchases, PR debits or admin edits that were never recorded; reconciliation starts at the migration boundary.

## Operational invariant

For every user after the migration and cutover:

```text
User.credits = SUM(CreditTransaction.value for that user)
```

The user ledger query and the admin per-user ledger query return both balances and their difference so drift is visible instead of silently hidden.

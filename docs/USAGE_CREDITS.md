# Mentor Credits

## Definition

Mentor credits are the user-facing unit for paid product usage. They translate
different mentor actions into a simple allowance without exposing provider
tokens, model names, internal cost estimates, or prompt size.

Credits are not money, stored value, cryptocurrency, provider tokens, or a
promise of a fixed number of words. They cannot be transferred between users or
redeemed for cash. Exact allocations and action costs are intentionally not set
in this documentation-only feature.

## What Uses Credits

Credits are consumed when MentorAndI successfully performs credit-bearing work,
including when mentors:

- Respond to a user.
- Create a structured plan.
- Process and remember approved context as part of a mentor interaction.
- Provide deeper guidance or run a deep mentor session.

One user request may involve several internal operations. The product should
show one understandable, disclosed credit cost or estimate for the user action
rather than exposing an unpredictable list of hidden model calls. Memory
retrieval alone should not silently create surprise charges; any credit cost for
memory work must be part of the disclosed interaction cost.

## Credit Principles

- No plan offers unlimited usage.
- Free Trial receives limited starter credits.
- Paid consumer plans receive recurring monthly credits.
- Premium receives more credits than Mentor Plus.
- Deep mentor sessions may use both credits and a plan-specific deep-session
  allowance; the exact relationship must be defined before implementation.
- Extra credit packs may be sold later, but pack sizes, prices, expiry, and plan
  eligibility remain future decisions.
- Users should see their available balance and the expected cost of a
  non-routine or high-credit action before confirming it.

## Credit Lifecycle

A future billing-grade flow should separate these events:

1. **Grant:** add starter, recurring, promotional, adjustment, or purchased
   credits with a source and effective period.
2. **Check:** verify server-side that the user has the plan access and credits
   required for the action.
3. **Reserve:** prevent concurrent requests from spending the same credits.
4. **Complete:** convert the reservation to a debit only after the
   credit-bearing result succeeds.
5. **Release or reverse:** restore reserved credits when a request fails before
   delivering the result, according to the published retry/refund policy.
6. **Expire:** apply an explicit rollover or expiry policy when one is later
   approved.

Every mutation must be idempotent. Provider retries, duplicate webhooks, page
refreshes, and repeated API submissions must not double-grant or double-charge.
Balances should be derived from or reconcilable against an append-only ledger,
not trusted from a browser value.

## Proposed Ledger Concepts

Later schema and service design will likely need, without being prescribed by
this document:

- User and plan entitlement reference.
- Credit event type: grant, reserve, debit, release, reversal, expiry, or admin
  adjustment.
- Amount and resulting balance or a deterministic balance calculation.
- Source: trial, subscription cycle, purchased pack, mentor action, reversal,
  or adjustment.
- Idempotency key and request correlation reference.
- Effective time, expiry time when applicable, and immutable creation time.
- Safe action category and mentor/model route metadata without duplicating
  prompts or responses.

Raw conversation text, mentor responses, secrets, and payment-card data do not
belong in the credit ledger. Raw internal database IDs must not be exposed in
user-facing credit history.

## Failed And Interrupted Work

The default design principle is that a failed request that delivers no useful
mentor result should not consume credits. A successfully delivered response is
normally chargeable even if the user dislikes it; quality complaints and manual
adjustments need a later support policy. Partial streams, tool failures after a
partial result, user cancellation, timeouts, and retries need explicit rules
and automated tests before launch.

Credit exhaustion must fail before expensive mentor work begins where possible.
The response should explain the balance problem and available choices without
discarding the user's unsent draft or pretending a payment succeeded.

## User Experience

The product should show:

- Current available credits.
- Next scheduled recurring grant or plan renewal when known.
- A clear low-credit warning.
- Expected credit cost for deep sessions, plans, or other non-routine actions.
- A plain-language reason when an action is blocked.
- An upgrade path and, when implemented, eligible credit-pack options.

It should not show raw provider token counts as mentor credits or make the user
calculate model cost. Operational token and estimated-cost monitoring remains
an internal concern.

## Relationship To Current Usage Limits

`docs/USAGE_LIMITS.md` describes the current alpha request-count guardrails
backed by `UsageEvent`. Those counters are operational safety controls and are
not a billing-grade credit balance. They must not be relabeled as credits.

A future system may enforce both layers:

- Credits answer whether the user's entitlement can fund the requested product
  action.
- Operational limits answer whether the request is safe to run within daily,
  weekly, monthly, abuse, concurrency, or deep-route guardrails.

Passing one layer never bypasses the other. Production should fail closed if
authoritative plan or credit state cannot be checked.

## Privacy And Ownership

Credit events belong to one resolved user or, for a company seat, to the
employee's private entitlement. Every read and mutation must enforce ownership
server-side. Employer reporting must never expose an employee's itemized credit
history when it could reveal use patterns or sensitive circumstances.

## Not Implemented

This document creates no credits, ledger, database model, API, checkout,
webhook, UI counter, or enforcement. It authorizes no Prisma change. Exact
quantities and commercial policies must be approved before runtime work.

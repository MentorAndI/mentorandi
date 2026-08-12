# Mentor Access Tiers

## Purpose

This document maps pricing plans to mentor and capability access. Feature 104
adds the first server-side mentor-access foundation; credit and deep-session
enforcement remain future work.

Plan access must eventually be enforced server-side at every boundary that can
select a mentor, load or create a mentor conversation, send a mentor request,
start a deep session, invoke an advanced program, or select a priority model
route. UI locking alone is not security.

## Access Matrix

| Capability | Free Trial | Single Mentor | Mentor Plus | Premium | Company Stress Mentor |
| --- | --- | --- | --- | --- | --- |
| Price | $0 | $19/month | $39/month | $69/month | $125/user/month |
| Life Mentor | Yes | Not included by definition | Yes | Yes | No consumer access implied |
| Specialist mentors | No | One chosen specialist | All main mentors | All main mentors | Company Stress Mentor only |
| Starter/monthly credits | Limited starter credits | Monthly credits | Monthly credits | More monthly credits | Company entitlement; exact allowance TBD |
| Deep mentor sessions | No | Not included by definition | Occasional allowance | Larger allowance | Company policy TBD |
| Practical techniques and exercises | Life Mentor starter scope | Chosen mentor scope | Yes | Yes | Stress-support scope |
| Shared memory across mentors | Not applicable | Not applicable across one mentor | Yes | Yes, with stronger continuity | Never shared with employer |
| Priority model quality | No | No | Standard routing | Yes | Company policy TBD |
| Advanced programs and deeper plans | No | No | No by default | Yes | Company stress programs only if contracted |

“Not included by definition” records the current product brief and must not be
silently turned into an entitlement. Product may revise it later with an
explicit documentation and pricing decision.

## Free Trial Access

Free Trial can create and use Life Mentor conversations while starter credits
remain. Specialist mentor routes, deep sessions, and premium programs are
locked. Life Mentor may recommend Plus or Premium when specialist support is a
better fit, while continuing to provide available, safe Life Mentor support.

## Single Mentor Access

Single Mentor grants access to exactly one user-selected specialist mentor.
The selected mentor must be stored and validated as an entitlement, not accepted
from a URL, browser state, or request body alone. Other mentor previews may be
visible but their conversations and response endpoints remain locked.

The policy for changing the selected specialist is unresolved. Until defined,
implementation must not infer that users can rotate the selection to obtain
all-mentor access.

## Mentor Plus Access

Mentor Plus grants access to all main consumer mentors, practical methods and
exercises, shared user-level memory across those mentors, and an occasional
deep-session allowance. The selected persisted conversation must still match
the requested mentor and belong to the resolved user.

## Premium Access

Premium includes Mentor Plus access with more credits, more deep sessions,
priority model-quality eligibility, stronger long-term continuity, advanced
programs, and deeper plans. Each advanced capability still needs its own
server-side eligibility and credit checks; Premium is not an unlimited bypass.

## Company Access

Company Stress Mentor is a distinct per-seat entitlement. It does not
automatically grant the employer or employee the consumer catalog, and consumer
plans do not automatically grant the company experience. Individual employee
conversations remain private and user-owned within the applicable product and
legal terms.

## Server-Side Enforcement Direction

### Foundation implemented in Feature 104

`services/mentor-access/mentor-access-policy.ts` is the central policy for
`free`, `single_mentor`, `plus`, `premium`, and `company_stress`. Mentor session
loading and creation now check this policy before returning or creating a
conversation, and both mentor response API paths check access before Mentor Core
or model work. Locked access returns HTTP 403 with:

- “This mentor is not included in your current plan.”
- “Upgrade to unlock specialist mentors.”

The current schema predates this plan model. Active/trialing `FREE` maps to
`free`; legacy `ALPHA` and `PERSONAL` map to `plus` to preserve the existing
multi-mentor alpha/test flow; and `PREMIUM` and `FOUNDER` map to `premium`.
Missing or inactive subscription state fails down to `free` in production and
staging, never Premium. Local development receives an explicit non-Premium
`plus` test entitlement so specialist dev/eval flows remain usable. Only
authenticated users reach production/staging mentor response and session APIs;
development fallback users remain confined to development-only paths.

The schema cannot yet assign `single_mentor` or `company_stress`, because
`SubscriptionPlan` lacks those values and there is no persisted selected mentor
or company-seat entitlement. A later reviewed migration must add the new plan
values (or a replacement entitlement model), a user-owned selected specialist,
and company seat state before those plans can be sold or activated. No
environment variable or client request can grant these plans in this
foundation.

Deep-session tiers (`none`, `limited`, and `expanded`) and Premium advanced-
program eligibility are represented in policy for later enforcement, but the
current request contract does not identify a deep session or advanced program.
Feature 104 therefore does not pretend to meter either capability.

A future authorization flow should:

1. Resolve the authenticated user without trusting client identifiers.
2. Load authoritative subscription and seat state.
3. Derive the effective plan and its validity window.
4. Verify that the requested mentor or capability belongs to that plan.
5. Verify ownership and mentor match for any existing conversation.
6. Check credits and operational usage limits.
7. Reserve the needed credits before expensive work.
8. Run Mentor Core only after every check passes.
9. Debit or release the reservation based on the outcome.
10. Return safe plan, credit, or access errors without exposing internal IDs or
    Stripe details.

Checks are required in both normal mentor response routes and development-like
boundaries that could accidentally become reachable. Production must fail
closed when authoritative plan state is unavailable. Local development may use
an explicit safe test entitlement, never an implicit production fallback.

## Locked Mentor Experience

A locked mentor should remain discoverable with:

- A short description of what the mentor helps with.
- A clear locked state.
- The plan needed to unlock it and the recurring price.
- An upgrade call to action.
- A route back to available mentors.

The UI must not create a conversation, send a hidden request, or imply access
before server authorization. Direct URLs and modified client requests must
receive the same server-side denial. Upgrade messaging should be proportionate,
not exploit distress, and never block crisis or emergency guidance behind a
paywall.

## Plan Changes

- **Upgrade:** after verified payment state, unlock the new tier without
  rewriting existing conversations. Exact proration and credit grants are TBD.
- **Downgrade:** at the disclosed effective time, lock mentors and capabilities
  outside the new tier while retaining the user's owned data.
- **Cancellation:** preserve access through any paid period required by policy,
  then apply the effective lower tier; do not delete data as a billing action.
- **Payment problem:** use a documented grace/retry policy. Browser redirects
  and unsigned webhook data cannot grant access.
- **Reactivation:** restore eligible access to existing conversations without
  cross-mentor history merging.

## Memory Boundaries

Shared memory in Plus and Premium refers to current user-level memories, goals,
and reflections made available through Mentor Core subject to relevance,
privacy, and user controls. It does not merge conversation histories. Premium's
stronger memory may increase continuity capacity but cannot weaken ownership,
deletion, or consent rules.

Company employee memory must never become an employer-visible record. Anonymous
company insights require a separately reviewed aggregation path and cannot be
constructed by exposing individual mentor context.

## Still Not Implemented

This foundation adds mentor access checks and policy only. It adds no Stripe
integration, credit ledger, schema, UI locks, purchased-plan activation, deep-
session meter, advanced program, or priority model routing. Existing request-
count usage limits remain separate.

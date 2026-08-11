# MentorAndI Pricing Model

## Purpose

This document defines the intended commercial model for MentorAndI. It is a
product and implementation direction, not a statement that billing, paid plan
access, or mentor credits are live. Current alpha behavior remains unchanged.

MentorAndI sells access to an ongoing mentor relationship, practical specialist
support, continuity, and deeper guidance. It does not sell raw model tokens and
does not promise unlimited usage.

## Plans

| Plan | Price | Intended access | Usage position |
| --- | ---: | --- | --- |
| Free Trial | $0 | Life Mentor only | Limited starter credits; no deep mentor sessions |
| Single Mentor | $19/month | One specialist mentor chosen by the user | Monthly mentor credits |
| Mentor Plus | $39/month | All main mentors | Monthly mentor credits and occasional deep mentor sessions |
| Premium | $69/month | All main mentors plus advanced programs and deeper plans | More monthly credits and more deep mentor sessions |
| Company Stress Mentor | $125/user/month | Dedicated employee Stress Mentor experience | Per-user access; no minimum seats |

Prices are product direction in US dollars. Taxes, supported currencies,
billing intervals other than monthly, refunds, proration, credit quantities,
credit-pack sizes, and regional pricing require later commercial and legal
decisions. They must not be invented in UI or runtime configuration.

## Free Trial — $0

The Free Trial gives a new user a useful but deliberately bounded introduction:

- Life Mentor only.
- A limited allocation of starter mentor credits.
- No specialist mentor access.
- No deep mentor sessions.
- No claim of unlimited use.

The Life Mentor may identify that specialist support would better fit the
user's situation and may recommend Mentor Plus or Premium. A recommendation
must be relevant and transparent, not fear-based, repetitive, or allowed to
interrupt crisis/safety guidance. The mentor must not pretend it cannot help
with ordinary Life Mentor support merely to force an upgrade.

## Single Mentor — $19/month

Single Mentor is for a user who wants sustained access to one specialist:

- The user chooses one specialist mentor.
- The plan includes a monthly allocation of mentor credits.
- Other specialist mentors remain locked and display a clear upgrade path.
- The user may upgrade at any time to unlock more mentors.

Changing the chosen specialist, any waiting period, and any limits on switching
are intentionally undecided. Runtime implementation must define these policies
before sale and must not silently switch, delete, or merge conversation history.

## Mentor Plus — $39/month

Mentor Plus is the main multi-mentor plan:

- Access to all main mentors.
- A monthly allocation of mentor credits.
- Practical techniques, exercises, and step-by-step guidance.
- Occasional deep mentor sessions within a separate plan allowance.
- Shared user-level memory across mentors, subject to the user's privacy and
  memory controls.

“All main mentors” means the consumer mentor catalog designated as main at the
time of implementation. It does not automatically include company-only
experiences, future premium-only programs, or every experimental mentor.

Shared memory does not mean shared conversation transcripts. Conversation
history remains scoped to its mentor and user; approved user-level memories,
goals, and reflections may support continuity across eligible mentors.

## Premium — $69/month

Premium is for users who want greater capacity and continuity:

- More monthly mentor credits than Mentor Plus.
- More deep mentor sessions than Mentor Plus.
- Stronger long-term memory, implemented through greater continuity capacity
  and careful retrieval—not weaker privacy boundaries.
- Priority model quality when plan routing is implemented.
- Advanced programs and deeper plans.

“Priority model quality” is a routing entitlement, not a guarantee that every
response uses the most expensive model or produces a superior outcome. Stronger
memory must remain user-owned, editable, exportable, and deletable. It must not
mean retaining content the user has asked MentorAndI to forget.

## Company Stress Mentor — $125/User/Month

The company offering has no minimum seat requirement. Each paid seat provides a
private employee Stress Mentor experience. Employers may receive only anonymous
company-level insights; they never receive individual conversations, messages,
memories, goals, reflections, prompts, or response content.

Company pricing, privacy boundaries, aggregation requirements, and unresolved
decisions are specified in `docs/COMPANY_STRESS_MENTOR.md`.

## Upgrade Logic

The intended upgrade flow is:

1. Explain what is currently locked and what the higher plan adds.
2. Show the exact new recurring price before checkout.
3. Use Stripe Checkout for payment authorization.
4. Treat access as pending until the app receives and validates authoritative
   subscription state through a signed webhook or safe server reconciliation.
5. Apply the new plan and credit entitlement server-side.
6. Unlock eligible mentors without rewriting or combining their histories.

Upgrades should be available at any time. Exact proration and immediate credit
grant rules must be chosen before implementation and kept consistent with
Stripe configuration. The UI must not assume success from a checkout redirect.

Downgrades and cancellations should normally take effect at the end of the
paid period unless an explicit, disclosed policy says otherwise. Losing access
must lock future use, not delete prior user data. Reactivation should restore
eligible access to the user's existing owned conversations.

## Upgrade Recommendations

An upgrade prompt may appear when:

- the user selects a mentor their plan does not include;
- the user has insufficient credits for a requested action;
- a Free Trial conversation clearly calls for a specialist mentor; or
- the user requests a deep session or advanced program outside their plan.

The prompt should say what is unavailable, which plan enables it, its price,
and what happens to existing data. It must offer a way back to currently
available support. Locked mentor cards should remain visible enough to explain
their purpose and show an upgrade call to action, but the server remains the
authority.

## Stripe And Application Responsibilities

Stripe is responsible for:

- Checkout and payment collection.
- Subscription billing state.
- Customer payment-method management.
- Signed billing webhooks.
- Receipts and Stripe-managed billing operations.

The MentorAndI application is responsible for:

- Mapping verified subscription state to an internal plan entitlement.
- Mentor access and server-side locks.
- Credit grants, reservations/debits, balances, and usage ledger.
- Deep-session allowances and model-routing eligibility.
- Upgrade messaging and product access decisions.
- User ownership, privacy, and auditability.

Stripe metadata is not the user-facing credit ledger, and browser-provided plan
claims are never authoritative. Webhook processing must be authenticated,
idempotent, replay-safe, and able to handle events out of order.

The repository already contains disabled/test-mode billing-readiness
foundations. This feature does not activate, extend, or configure them. No live
payment implementation is authorized by this document.

## Launch Decisions Still Required

Before implementation or sale, product, finance, privacy, and engineering must
define:

- Exact starter and monthly credit allocations.
- Credit costs for each action and deep-session allowance quantities.
- Rollover, expiry, refund, failed-response, retry, and purchased-pack policy.
- Upgrade proration, downgrade timing, cancellation, grace period, and failed
  payment behavior.
- Single Mentor switching rules.
- What counts as a main mentor, advanced program, and deeper plan.
- Tax, currency, regional pricing, invoicing, and consumer-law requirements.
- Company anonymity thresholds, insight governance, and contract terms.

Until those decisions and server-side enforcement exist, pricing documentation
must not be presented as an active paid entitlement.

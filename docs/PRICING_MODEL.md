# MentorAndI Pricing Model

## Purpose

This document defines the commercial launch model for MentorAndI. MentorAndI
sells access to an ongoing mentor relationship, specialist support, continuity,
and deeper guidance. It does not sell raw model tokens and does not promise
unlimited usage.

## Plans

| Plan | Price | Access | Credits |
| --- | ---: | --- | ---: |
| Free Trial | $0 | Life Mentor only | 25 starter credits once |
| Single Mentor | $19/month | Life Mentor + one chosen specialist | 800/month |
| Mentor Plus | $39/month | All main mentors | 2,000/month |
| Premium | $69/month | All main mentors + advanced/deeper programs | 5,000/month |
| Company Stress Mentor | $125/user/month | Dedicated employee Stress Mentor | 5,000/user/month |

Company Stress Mentor remains hidden from the public consumer purchase flow
until the company product is deliberately launched.

## Credit Economics

The credit system is tied to MentorAI Corp's variable provider cost rather than
a fixed message count:

- 1 credit represents $0.01 of user-facing AI usage value.
- Every successful OpenAI or Anthropic call is charged to the user at exactly
  2× MentorAI Corp's calculated provider API cost.
- Credits debited are `(provider cost × 2) / $0.01`, rounded upward to two
  decimal places.
- Failed provider/pipeline work does not consume credits.
- Provider/model/token usage is measured server-side and cannot be supplied by
  the browser.

This means the included allocations correspond to the following maximum
provider-cost budgets if fully consumed:

| Plan allocation | User AI usage value | Maximum provider API cost at 2× |
| ---: | ---: | ---: |
| 25 | $0.25 | $0.125 |
| 800 | $8.00 | $4.00 |
| 2,000 | $20.00 | $10.00 |
| 5,000 | $50.00 | $25.00 |

Subscription revenue also pays for the MentorAndI product, infrastructure,
payment fees, development, support and margin; the credit allocation only meters
variable AI-provider consumption.

## Free Trial — $0

The Free Trial gives a new user a useful but bounded introduction:

- Life Mentor only.
- 25 starter credits, granted once.
- No card required.
- No specialist mentor access.
- No deep mentor-session entitlement.

When the starter credits are exhausted, the next provider call is blocked before
incurring API cost and the user is shown an upgrade path.

## Single Mentor — $19/month

Single Mentor is for a user who wants sustained access to one specialist:

- Life Mentor plus one chosen specialist.
- 800 credits for each authoritative paid billing period.
- Other specialist mentors remain locked and display an upgrade path.
- The user may upgrade to Mentor Plus or Premium.

The first specialist selected for the plan is stored server-side and is not
trusted from a browser plan claim.

## Mentor Plus — $39/month

Mentor Plus is the main multi-mentor plan:

- Access to all main consumer mentors.
- 2,000 credits per paid billing period.
- Practical techniques, exercises and step-by-step guidance.
- Limited deep mentor sessions under the separate operational entitlement.
- Shared user-level memory across eligible mentors, subject to user privacy and
  memory controls.

## Premium — $69/month

Premium is for users who want greater capacity and continuity:

- Access to all main consumer mentors.
- 5,000 credits per paid billing period.
- Expanded deep mentor sessions.
- Advanced and longer-term mentor programs.
- Priority model quality when routing policy selects it.

Priority model quality is a routing entitlement, not a promise that every
response uses the most expensive model.

## Company Stress Mentor — $125/User/Month

The company offering has no minimum seat requirement. Each paid seat provides a
private employee Stress Mentor experience with 5,000 credits per paid billing
period. Employers may receive only anonymous company-level insights; they never
receive individual conversations, messages, memories, goals, reflections,
prompts, credit history, or response content.

## Credit Periods And Rollover

Plan credits reset when a new paid Stripe subscription period becomes
authoritative through a verified webhook. Unused plan credits do not roll over.

The system maintains a separate top-up bucket so purchased credits can later be
preserved across monthly resets. Public top-up purchases are not active at
launch until their pack sizes/prices are reconciled with the strict 2×
provider-cost rule.

When a paid subscription actually ends, remaining plan credits are cleared.
Future purchased top-up credits remain separate.

## Upgrade Logic

The intended upgrade flow is:

1. Explain what is locked and what the higher plan adds.
2. Show the exact recurring price before checkout.
3. Use Stripe Checkout for payment authorization.
4. Treat browser redirects as non-authoritative.
5. Apply subscription state only from signed Stripe webhooks or safe server
   reconciliation.
6. Apply the plan's credit allocation server-side from authoritative
   subscription-period state.
7. Unlock eligible mentors without rewriting or combining conversation history.

The initial launch implementation grants the target plan's full allocation when
a verified active/trialing subscription event establishes a new plan/period
key. The idempotency key prevents repeated webhooks from granting the same
allocation twice.

Downgrades and cancellations normally take effect according to the authoritative
Stripe subscription state. Losing access locks future use; it does not delete
prior user data.

## Upgrade Recommendations

An upgrade prompt may appear when:

- the user selects a mentor their plan does not include;
- the user's credit balance is exhausted;
- a Free Trial conversation clearly calls for a specialist mentor; or
- the user requests a deep session or advanced program outside their plan.

Upgrade messaging must remain relevant and transparent, not fear-based or
repetitive.

## Stripe And Application Responsibilities

Stripe is responsible for:

- Checkout and payment collection.
- Subscription billing state.
- Customer payment-method management.
- Signed billing webhooks.
- Receipts and Stripe-managed billing operations.

The MentorAndI application is responsible for:

- Mapping verified subscription state to internal plan entitlement.
- Mentor access and server-side locks.
- Credit grants, balances and usage debits.
- Provider/model token-cost calculation.
- Deep-session allowances and model-routing eligibility.
- Upgrade messaging and product access decisions.
- User ownership, privacy and auditability.

Stripe metadata is not the user-facing credit ledger, and browser-provided plan
or credit claims are never authoritative. Webhook processing must remain signed,
idempotent and environment-matched.

## Launch Decisions Remaining

The core subscription and credit quantities are now decided. Remaining
commercial decisions include:

- public top-up pack sizes/prices and any expiry policy;
- refund/manual credit-adjustment support policy;
- detailed proration behavior for mid-period upgrades/downgrades;
- Single Mentor specialist-switching policy;
- tax, regional pricing and consumer-law disclosures;
- company anonymity thresholds and reporting governance.

These items do not change the launch rule that successful AI usage is metered at
2× provider API cost through the credit ledger.

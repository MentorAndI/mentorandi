# Mentor Credits

## Definition

Mentor credits are the user-facing unit for metered AI usage inside MentorAndI.
They deliberately hide raw provider tokens and model pricing from the product
experience while preserving a deterministic relationship to MentorAI Corp's
actual OpenAI or Anthropic API cost.

Credits are not money, stored value, cryptocurrency, provider tokens, or a
promise of a fixed number of words. They cannot be transferred between users or
redeemed for cash.

## Commercial Formula

The launch formula is intentionally simple:

- **1 Mentor credit = $0.01 of user-facing AI usage value.**
- **User AI usage cost = 2 × MentorAI Corp's provider API cost.**
- `credits debited = (provider API cost in USD × 2) / 0.01`.
- Debits are rounded upward to two decimal places so rounding can never reduce
  the agreed 2× provider-cost multiplier.

The provider cost is calculated from the actual input/output token usage
returned by OpenAI or Anthropic and the configured model's current token rates.
Where OpenAI reports cached input tokens, the lower cached-input rate is used.
Known model rates are versioned in code. An unknown model must not create an
arbitrary user charge; it can use explicit configured fallback rates or record
usage without debiting credits until pricing is known.

### Example

A production GPT-5.4 mini response using 767 input tokens and 183 output tokens,
at $0.75 per million input tokens and $4.50 per million output tokens, costs:

- Provider cost: `$0.00139875`.
- User AI usage value at 2×: `$0.00279750`.
- Credit debit: `0.28 credits` after upward rounding to two decimals.

## Launch Allocations

| Plan | Credit allocation |
| --- | ---: |
| Free Trial | 25 starter credits, once |
| Single Mentor | 800 credits per paid billing period |
| Mentor Plus | 2,000 credits per paid billing period |
| Premium | 5,000 credits per paid billing period |
| Company Stress Mentor | 5,000 credits per paid seat/billing period |

Legacy Personal maps to the Mentor Plus allocation. Founder accounts map to the
Premium allocation unless a future explicit founder policy replaces it.

## Balance Model

The user sees one total balance. Internally the balance has two buckets:

1. **Plan balance** — starter or recurring credits supplied by the current plan.
2. **Top-up balance** — separately purchased credits, reserved for a later
   top-up purchase implementation.

When a new paid Stripe billing period becomes authoritative through a verified
subscription webhook, the old plan balance is reset and the new plan allocation
is granted. Plan credits therefore do not roll over. The separate top-up balance
is preserved across monthly plan resets.

When a paid subscription actually ends, the remaining plan balance is cleared.
Any future top-up balance remains separate.

## Usage Debit Lifecycle

For the current mentor-response flow:

1. Resolve the authenticated user and mentor entitlement.
2. Check operational request limits.
3. Check that the user has a positive credit balance before calling a provider.
4. Run the mentor response through OpenAI or Anthropic.
5. Persist a successful `UsageEvent` with provider, model, token counts and
   provider-cost estimate.
6. Calculate the 2× user cost and debit the account.
7. Link the debit to the unique `UsageEvent` and return the new balance to the
   UI.

The `usageEventId` and ledger idempotency key prevent the same successful call
from being debited twice. Credit-account mutations lock the account row while
updating the balance so concurrent requests cannot silently overwrite each
other.

Because exact token cost is only known after the provider responds, a final
response may slightly exceed the remaining balance. The exact debit is retained
internally and the visible balance becomes zero; the next provider call is
blocked before it incurs cost.

## Failed Work

A provider or mentor-pipeline failure that does not produce a successful mentor
response consumes **0 credits**. Operational `FAILURE` and `BLOCKED` usage events
remain available for internal monitoring but do not create `USAGE_DEBIT` ledger
entries.

If provider pricing or token usage is unavailable, MentorAndI must not invent a
charge. The successful usage event remains auditable and can be investigated.

## Ledger

`CreditAccount` stores the current plan and top-up buckets plus lifetime granted
and used totals. `CreditTransaction` is the append-only audit trail and records:

- starter grants;
- plan resets;
- recurring plan grants;
- usage debits;
- future top-ups; and
- explicit administrative adjustments.

Usage debit rows may contain provider/model, provider API cost, 2× retail cost
and the linked usage event. Conversation text, mentor responses, payment-card
data and secrets do not belong in the credit ledger.

## User Experience

The mentor screen shows the current credit balance and updates it immediately
after a successful mentor response. When credits reach zero, MentorAndI blocks
the next provider call and offers the user an upgrade/refill path.

Users do not need to understand token counts, model names, cached-token pricing
or provider rate cards. Those remain internal accounting details.

## Relationship To Operational Limits

Credits and operational limits are separate controls:

- Credits determine whether the user's commercial entitlement can fund AI work.
- Operational limits control daily/weekly/monthly usage, abuse and deep-route
  safety/cost ceilings.

Passing one layer does not bypass the other.

## Top-Up Packs

The data model supports top-up credits, but public top-up purchase products are
**not activated by this feature**. Previously discussed pack sizes/prices must
be reconciled with the strict 2× provider-cost rule before Stripe top-up products
are created.

## Security

Credit tables are server-only. Row Level Security is enabled and direct
`anon`/`authenticated` grants are revoked. Browser-provided balances, debit
amounts, plan names or provider costs are never authoritative.

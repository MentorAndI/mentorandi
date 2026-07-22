# Mentor And I Payments Readiness

This foundation prepares the private alpha for a later paid launch. Staging can
be explicitly enabled for Stripe test-mode checkout by following
`docs/STRIPE_STAGING_SETUP.md`; it does not enable live payment collection or
claim revenue, customers, or final pricing.

## What exists now

- `/pricing` presents invite-only Alpha plus planned Personal and Premium
  monthly tiers without publishing an unapproved price.
- A one-to-one `Subscription` record stores plan, lifecycle status, provider
  references, period end, cancellation state, and timestamps.
- Authenticated server routes can create Stripe Checkout and Billing Portal
  sessions when billing is enabled and fully configured.
- `/api/billing/webhook` verifies Stripe's signed raw request before applying
  checkout or subscription state changes.
- Usage enforcement resolves the active entitlement. Alpha/free users retain
  current limits; active/trialing Personal and Premium users receive adjustable
  higher message and deep-route allowances.
- `/admin/billing` is protected by `ALPHA_ADMIN_EMAILS` and displays email,
  plan/status, abbreviated customer reference, period end, and cancellation
  state. It never displays secrets or full customer identifiers.

## Required environment variables

```text
NEXT_PUBLIC_STRIPE_ENABLED=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PERSONAL_MONTHLY=
STRIPE_PRICE_PREMIUM_MONTHLY=
```

Keep `NEXT_PUBLIC_STRIPE_ENABLED=false` unless running the controlled staging
test flow. When it is `true`, `npm run check:env` requires all four private
Stripe/price values and requires `STRIPE_SECRET_KEY` to be a test key. Only the
boolean flag is public; secret keys, webhook secrets, and price IDs remain
server-side environment values and must never be committed.

The staging Docker build receives the public flag as a build argument because
Next.js embeds `NEXT_PUBLIC_*` values at build time. Runtime containers receive
the private values from `.env.staging`.

## Stripe setup before enabling

Use the detailed staging runbook in `docs/STRIPE_STAGING_SETUP.md`. The alpha
implementation pins Stripe API `2026-02-25.clover`, rejects live secret keys and
live webhook events, and derives current billing periods from current
subscription-item payloads.

1. Approve final product names, prices, currencies, benefits, refund terms, and
   whether taxes are handled through Stripe Tax or another process.
2. Create recurring Personal and Premium prices in the intended Stripe mode
   (test or live) and set the two price environment values.
3. Configure the Stripe Customer Portal and allowed subscription changes.
4. Register `https://<app-host>/api/billing/webhook`, subscribe to checkout
   completion and customer subscription lifecycle events, then install its
   signing secret.
5. Test signup, checkout, webhook retries, upgrades/downgrades, cancellation,
   failed renewal, portal return, and entitlement changes with Stripe test mode.
6. Confirm privacy terms, accounting, tax, support, refund, incident response,
   monitoring, and reconciliation procedures.
7. Set the public flag to `true`, rebuild/deploy, run smoke checks, and complete
   a controlled real-payment test before opening access.

## Safety and operational boundaries

- Checkout and portal routes return safe errors if disabled or incomplete; no
  charge is attempted.
- Webhook state changes require an HMAC-verified Stripe signature with a short
  replay-tolerance window.
- Webhook updates are idempotent upserts by user/subscription identity. A future
  billing-grade system should also persist processed event IDs and add formal
  reconciliation/alerting.
- No card or payment-method data is stored by Mentor And I.
- Current cost monitoring is estimated operational analytics, not billing-grade
  metering and not the basis for customer invoices.
- Tier multipliers are initial adjustable entitlement defaults, not contractual
  product promises.

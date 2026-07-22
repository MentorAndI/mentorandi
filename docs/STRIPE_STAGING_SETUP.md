# Stripe Staging Setup

This runbook enables Mentor And I's existing billing foundation in Stripe test
mode on staging. It must not use live keys, accept real payments, or be treated
as a live billing launch.

## Safety boundary

- Use Stripe Workbench/Dashboard with **Test mode** enabled.
- Use only a secret key beginning with `sk_test_`.
- Never paste keys, webhook secrets, or private price configuration into Git,
  GitHub Actions logs, screenshots, support messages, or browser code.
- The application rejects non-test secret keys and webhook events where
  `livemode` is not `false`.
- `NEXT_PUBLIC_STRIPE_ENABLED` is only a public UI switch. Every other Stripe
  value is server-side only.

## Required staging environment

Set these values in `/docker/mentorandi/.env.staging` on the VPS. The examples
are intentionally empty and contain no usable credentials.

```text
APP_URL=https://staging.mentorandi.com
NEXT_PUBLIC_STRIPE_ENABLED=true
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PERSONAL_MONTHLY=
STRIPE_PRICE_PREMIUM_MONTHLY=
```

Expected formats:

- `STRIPE_SECRET_KEY`: Stripe test secret key beginning `sk_test_`
- `STRIPE_WEBHOOK_SECRET`: signing secret beginning `whsec_` from the staging
  webhook destination—not a Dashboard API key
- both price variables: recurring test Price IDs beginning `price_`

After changing the public flag, rebuild the app rather than only restarting it.
The staging Docker build receives `NEXT_PUBLIC_STRIPE_ENABLED` at build time;
the private values stay in the runtime env file.

## Recommended setup helper

Create or reveal a new Stripe **test** secret key, then run the helper
from a trusted local terminal or directly on the VPS:

```bash
STRIPE_SECRET_KEY=sk_test_xxx npm run setup:stripe:staging
```

The dependency-free helper uses Stripe's test API to create or reuse the
`Mentor And I Personal` and `Mentor And I Premium` products, monthly test
prices, and the existing app webhook route at
`https://staging.mentorandi.com/api/billing/webhook`. It refuses live keys and
live-mode resources. The default setup amounts are USD 10.00 and USD 20.00 per
month for test-mode plumbing only; they are not approved customer pricing.
Optional overrides use minor currency units:

```bash
STRIPE_SECRET_KEY=sk_test_xxx \
STRIPE_TEST_CURRENCY=usd \
STRIPE_TEST_PERSONAL_MONTHLY_AMOUNT=1000 \
STRIPE_TEST_PREMIUM_MONTHLY_AMOUNT=2000 \
npm run setup:stripe:staging
```

Copy the five printed `.env.staging` assignments into
`/docker/mentorandi/.env.staging`. The helper deliberately redacts the API key;
replace its `STRIPE_SECRET_KEY` placeholder with the same `sk_test_...` value
from the shell. It prints a newly created webhook signing secret once, along
with both Price IDs and the public enable flag. Do not save the terminal output
in the repository or CI logs.

Stripe does not reveal a webhook signing secret again after endpoint creation.
On a later idempotent run, provide the already stored secret so the helper can
reuse and update the destination safely:

```bash
STRIPE_SECRET_KEY=sk_test_xxx \
STRIPE_WEBHOOK_SECRET=whsec_xxx \
npm run setup:stripe:staging
```

The helper stops instead of duplicating an existing destination when that
secret is unavailable. After copying the values, redeploy staging and test
`/pricing` with `4242 4242 4242 4242`, a future expiry, and any valid CVC.

## Manual alternative: create test products and monthly prices

1. Open Stripe Dashboard/Workbench and turn on **Test mode**.
2. Create a `Personal` product and add a recurring monthly price.
3. Create a `Premium` product and add a recurring monthly price.
4. Copy each test `price_...` identifier into its matching staging variable.
5. Keep the amounts internal while product pricing is still under review. The
   public page intentionally says that the final monthly price is unconfirmed.

The app sends only the server-configured Price ID. A browser cannot submit an
arbitrary Stripe Price ID; it can request only `PERSONAL` or `PREMIUM`.

## Manual alternative: configure the test webhook

1. In Stripe test mode, create a webhook destination for:
   `https://staging.mentorandi.com/api/billing/webhook`.
2. Use Stripe API version `2026-02-25.clover`, matching the version pinned on
   outbound requests in the application.
3. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Reveal the destination signing secret and set it as
   `STRIPE_WEBHOOK_SECRET` in `.env.staging`.
5. Send a Stripe test event and confirm the endpoint returns HTTP 200 for a
   correctly signed test event. Missing/invalid signatures and live-mode events
   must return an error and must not update the database.

The route reads the raw request body before JSON parsing, verifies Stripe's
timestamped HMAC signature with a five-minute tolerance, and only then applies
an idempotent subscription upsert. Do not place a JSON parser or proxy body
transformation in front of this route.

## Enable and deploy staging

1. Add all five Stripe values to `.env.staging` with the test-mode values.
2. Run `npm run check:env` in an equivalent configured environment. Validation
   rejects a non-test secret key, malformed webhook secret, or malformed Price
   IDs.
3. Deploy/rebuild staging with the normal GitHub Actions workflow or
   `npm run deploy:staging`.
4. Open `/pricing`. It should display `Stripe test mode`, a no-real-charges
   notice, and enabled `Test Personal checkout` and `Test Premium checkout`
   buttons.

If the flag or any required value is absent/invalid, `/pricing` stays usable,
shows `Payments are not enabled yet`, and disables checkout. Existing alpha
access is unchanged.

## Test Checkout end to end

1. Sign into an invited staging alpha account.
2. Open `https://staging.mentorandi.com/pricing`.
3. Choose a test plan. The authenticated server route creates a hosted Stripe
   Checkout Session in `subscription` mode and redirects the browser to Stripe.
4. Complete Checkout with Stripe's standard successful test card number
   `4242 4242 4242 4242`, any future expiry date, any CVC, and any valid postal
   code. Never enter a real card in this staging flow.
5. Stripe returns to `/settings?billing=success`. The page explains that the
   verified webhook, not the redirect, applies subscription state.
6. In Stripe Workbench, confirm successful delivery of the checkout and
   subscription events.
7. With an allowlisted admin account, open `/admin/billing` and confirm the
   tester shows the expected Personal/Premium plan, active/trialing status,
   abbreviated customer reference, period end, and cancellation state.

The checkout route requires a real authenticated Supabase account. An
unauthenticated tester is redirected to login before a session can be created.

## Test the customer portal

1. In Stripe **test mode**, configure the Customer Portal and enable only the
   actions intended for this test, such as payment-method updates and
   cancellation.
2. Return to `/settings` with the same staging user after webhook delivery.
3. Choose `Manage test billing`.
4. Confirm Stripe opens the portal for the customer saved by the checkout
   webhook and returns to `/settings` afterward.
5. Make a test cancellation or supported plan change. Confirm the subsequent
   `customer.subscription.updated` or `.deleted` event updates
   `/admin/billing`.

Users without a stored Stripe customer ID receive a safe `No billing account`
response; the app does not invent or expose a customer record.

## Entitlement behavior

- A user with no subscription row, a missing payment, or an inactive record
  continues with the existing Alpha entitlement and limits.
- Active/trialing test Personal subscriptions receive the prepared higher
  message/deep-route multipliers.
- Active/trialing test Premium subscriptions receive the prepared Premium
  multipliers, including the higher deep-route allowance.
- Past-due, canceled, unpaid, incomplete, and inactive subscriptions fall back
  to Alpha access. No existing alpha user is blocked for not paying.

These multipliers are adjustable alpha configuration, not final commercial
promises.

## Before live billing

Live billing requires a separate, explicit feature and launch decision. Before
that change:

- approve final prices, currencies, plan benefits, refund/cancellation terms,
  taxes, invoicing, support, privacy, and legal language
- add durable Stripe event-ID deduplication, reconciliation, failure alerting,
  and operational dashboards
- handle invoice success/failure communications and recovery flows
- test upgrades, downgrades, prorations, trials, coupons, failed renewals,
  disputes, refunds, cancellations, and account deletion
- review the entitlement policy for grace periods and past-due accounts
- complete controlled live-mode validation with separate live products, prices,
  keys, webhook destination, and signing secret
- deliberately remove or replace the code-level test-key/live-event guard only
  as part of that reviewed live-billing change

Until then, staging remains test mode and real customers must not be charged.

## Stripe references

- [Build subscriptions with Stripe Checkout](https://docs.stripe.com/payments/checkout/build-subscriptions)
- [Verify webhook signatures](https://docs.stripe.com/webhooks/signature)
- [Subscription webhook events](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe test payment methods](https://docs.stripe.com/testing)

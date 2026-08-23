# MentorAndI Production Launch Runbook

## Architecture

- `https://mentorandi.com` — public marketing website.
- `https://app.mentorandi.com` — customer production application.
- `https://staging.mentorandi.com` — isolated test/staging application. Keep Stripe in test mode.

Production and staging use separate Supabase projects and separate environment files. Never copy a staging database or Stripe customer/subscription IDs into production.

## Production Supabase

Project: `MentorAndI Production`

Project ref: `kilqtuomaqkecgfaywjf`

Region: `eu-west-1`

API URL:

```text
https://kilqtuomaqkecgfaywjf.supabase.co
```

The production database starts empty. `prisma migrate deploy` creates the application schema. The production deployment then runs `prisma/security/rls-hardening.sql`. Do not run the development seed in production.

Supabase Auth must allow:

```text
https://app.mentorandi.com/auth/callback
```

Set the production site URL/origin to `https://app.mentorandi.com` where required by Supabase Auth.

## Production environment

Create `/docker/mentorandi/.env.production` on the Hostinger VPS. Never commit this file.

Start from a clean file. Do not copy staging database, Supabase or Stripe values. LLM provider/model keys and non-environment-specific operational limits may be copied selectively from `.env.staging` when they are intentionally shared.

Required production values include:

```env
NODE_ENV=production
APP_URL=https://app.mentorandi.com
DATABASE_URL=<PRODUCTION_SUPABASE_POSTGRES_CONNECTION_STRING>
NEXT_PUBLIC_SUPABASE_URL=https://kilqtuomaqkecgfaywjf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PRODUCTION_SUPABASE_PUBLISHABLE_OR_ANON_KEY>

LLM_PROVIDER=<same approved real provider used for production>
OPENAI_API_KEY=<if OpenAI is used>
OPENAI_MODEL=<if OpenAI is used>
ANTHROPIC_API_KEY=<if Anthropic is used>
ANTHROPIC_MODEL=<if Anthropic is used>

NEXT_PUBLIC_STRIPE_ENABLED=false
STRIPE_MODE=live
STRIPE_SECRET_KEY=<STRIPE_LIVE_OR_RESTRICTED_BACKEND_KEY>
STRIPE_WEBHOOK_SECRET=<PRODUCTION_WEBHOOK_SIGNING_SECRET>
STRIPE_PRICE_SINGLE_MONTHLY=price_1U7aGdFvTC9VPpkiC2OZcOTu
STRIPE_PRICE_PLUS_MONTHLY=price_1U7aGkFvTC9VPpkibY6gagMw
STRIPE_PRICE_PREMIUM_MONTHLY=price_1U7aGqFvTC9VPpkizYUkT57i
```

Keep `NEXT_PUBLIC_STRIPE_ENABLED=false` until the launch gates below are satisfied. When enabled, `scripts/check-env.mjs` verifies that `STRIPE_MODE=live` is paired with a live/restricted-live Stripe key. Staging defaults to `STRIPE_MODE=test` and does not accept live webhook events.

## Stripe production resources

Approved recurring live prices:

- Single Mentor — USD 19/month — `price_1U7aGdFvTC9VPpkiC2OZcOTu`
- Mentor Plus — USD 39/month — `price_1U7aGkFvTC9VPpkibY6gagMw`
- Premium — USD 69/month — `price_1U7aGqFvTC9VPpkizYUkT57i`
- Company Stress Mentor — USD 125/user/month — `price_1U7aGvFvTC9VPpkihagauEc6`

Production webhook endpoint:

```text
https://app.mentorandi.com/api/billing/webhook
```

Enabled events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

The webhook is live-mode only. Its signing secret belongs only in `.env.production`.

## Deploy

The repository contains `docker-compose.production.yml` and `.github/workflows/deploy-production.yml`.

Production deployment is intentionally manual-only. The deploy performs, in order:

1. Validate `.env.production` before touching the database.
2. `prisma migrate deploy` against production Supabase.
3. Apply RLS hardening.
4. Build/start the separate `mentorandi-production` container.
5. Route Traefik `Host(app.mentorandi.com)` to that container.
6. Check `/api/health` unless explicitly skipped during the DNS move.

Do not replace or stop `mentorandi-staging`.

## DNS

After the production container/router is ready, point the `app` DNS record to the same Hostinger VPS that currently serves `staging.mentorandi.com`. Remove any conflicting legacy `app` A/AAAA/CNAME record first.

Once DNS and TLS resolve correctly, verify:

```text
https://app.mentorandi.com/api/health
https://app.mentorandi.com/signup?plan=free
https://app.mentorandi.com/signup?plan=single
https://app.mentorandi.com/signup?plan=plus
https://app.mentorandi.com/signup?plan=premium
```

## Marketing website handoff

Only after the production app passes health/auth checks, change the static marketing CTAs to absolute application URLs:

```text
https://app.mentorandi.com/signup?plan=free
https://app.mentorandi.com/signup?plan=single
https://app.mentorandi.com/signup?plan=plus
https://app.mentorandi.com/signup?plan=premium
```

Do not put Stripe secret keys, webhook secrets or Stripe Checkout URLs in the static marketing site.

## Launch gates before enabling real checkout

1. Production Supabase schema migrated and RLS hardening applied.
2. Production Supabase Auth redirect verified.
3. Production app health is `ok` and real LLM provider is configured.
4. Stripe live backend key and webhook signing secret are present only in `.env.production`.
5. Customer subscription management/cancellation flow is verified.
6. Mentor Credits commercial promise is implementable and enforced. The current repository documents Mentor Credits but does not yet contain a billing-grade credit ledger/grant/debit system. Do not take payment for quantified credit allowances until this is resolved, or change the public offer before enabling checkout.
7. Run one controlled real payment through: signup → checkout → payment → signed webhook → subscription row → correct mentor entitlement → billing management/cancellation.
8. Only after that controlled payment passes, set `NEXT_PUBLIC_STRIPE_ENABLED=true`, redeploy, and switch marketing CTAs to production.

Credit top-up packs must remain non-purchasable until the credit ledger exists and their lifecycle/consumption rules are implemented.

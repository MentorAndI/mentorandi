# Alpha Deployment Checklist

Use this checklist before deploying MentorAndI alpha to Hostinger/VPS or a staging VPS. It is an operational gate, not a replacement for `docs/DEPLOYMENT.md`, `docs/VPS_DEPLOYMENT.md` or `docs/BACKUP_AND_RECOVERY.md`.

## 1. Scope Gate

- Confirm the target environment: staging or alpha production.
- Confirm the target domain and expected `APP_URL`.
- Confirm the deployment branch is `main`.
- Confirm no local `.env` changes are staged or committed.
- Confirm no generated `reports/*.json` files are staged.
- Confirm no unexpected Prisma schema or package-lock changes are present.
- Confirm the deployment contains only reviewed feature work intended for alpha.

## 2. Source And Build Gate

Run locally before deployment:

```bash
npm run check:env
npm run lint
npm run build
git status
```

Do not deploy if lint or build fails.

If Supabase is unavailable, still run `check:env`, `lint` and `build`, but skip database-dependent evals and record that DB verification is pending.

## 3. Secrets And Environment Gate

Use `.env.example` as the variable list. Do not copy real secrets into source control.

Required production/staging secrets:

- `DATABASE_URL`
- `APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Real provider key for the selected route or provider:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`

Provider configuration:

- `LLM_PROVIDER` may be used as a simple fallback.
- `LLM_DEFAULT_PROVIDER` and `LLM_DEFAULT_MODEL` should point to the normal daily model.
- `LLM_CHEAP_PROVIDER` and `LLM_CHEAP_MODEL` should point to the low-cost daily model.
- `LLM_DEEP_PROVIDER` and `LLM_DEEP_MODEL` should point to the stronger mentor model.
- `LLM_PROVIDER=mock` must not be used for production alpha.

Cost and usage guardrails:

- Configure `LLM_MAX_OUTPUT_TOKENS`.
- Configure `LLM_CONTEXT_BUDGET_TOKENS`.
- Configure `MENTOR_METHODS_LIMIT`, `MENTOR_EXPERTISE_LIMIT` and `MENTOR_SOURCES_LIMIT`.
- Configure optional `LLM_INPUT_COST_PER_1M` and `LLM_OUTPUT_COST_PER_1M` for diagnostics.
- Decide whether `USAGE_LIMITS_ENABLED` should enforce limits.
- Configure `ALPHA_DAILY_MESSAGE_LIMIT`, `ALPHA_WEEKLY_MESSAGE_LIMIT`, `ALPHA_MONTHLY_MESSAGE_LIMIT` and `ALPHA_WEEKLY_DEEP_LIMIT` if overriding the defaults.
- Configure `ALPHA_ADMIN_EMAILS` with the authenticated emails allowed to review
  `/admin`, `/admin/feedback`, `/admin/usage` and `/admin/invites`.
- Create database-backed tester invites from `/admin/invites` and verify that
  missing, expired, revoked, exhausted, and email-mismatched codes are rejected.
- Configure `ALPHA_INVITE_CODE` only if an emergency/development fallback is
  needed; do not use it as the primary shared alpha access mechanism.
- Confirm `/contact` links to `support@mentorandi.com` and describes in-product
  feedback and useful bug reports.

## 4. Supabase Gate

- Confirm the Supabase project is the intended staging/alpha project.
- Confirm the `DATABASE_URL` points at the correct database.
- Confirm `APP_URL` is the public app URL, for example `https://staging.mentorandi.com`, so auth callbacks never redirect to Docker internals.
- Confirm Supabase Auth URL and anon key match the deployment environment.
- Confirm Supabase Auth redirect URLs include:
  - `https://staging.mentorandi.com/auth/callback`
  - `http://localhost:3000/auth/callback`
- Confirm `prisma/security/rls-hardening.sql` has been reviewed or run for the target database.
- Confirm RLS is enabled on all public app tables and no unrestricted `anon`/`authenticated` policies exist.
- Run `prisma migrate deploy` through the one-shot staging migration service
  before starting an app image that depends on new tables; stop if it fails.
- Confirm database backups or recovery plan are available before risky operations.
- Do not apply Prisma schema changes unless the feature explicitly requires them and the migration has been reviewed.

## 5. VPS Gate

For Hostinger/VPS deployment:

- Install current Node.js LTS, Git and PM2.
- Clone or update the repository on the server.
- Install dependencies with `npm install`.
- Configure environment variables on the server or in the deployment secret manager.
- Run `npm run check:env` on the server.
- Run `npm run build` on the server.
- Start or reload the app with PM2.
- Save the PM2 process list.

See `docs/VPS_DEPLOYMENT.md` for the command-level guide.

## 6. Health Gate

After deployment, verify:

```bash
APP_URL=https://your-domain.example npm run smoke:prod
APP_URL=https://your-domain.example npm run smoke:alpha
```

Open:

```text
https://your-domain.example/api/health
```

Expected:

- `status` is `ok` or intentionally understood as `degraded`.
- `database` is `connected`.
- `auth` is `configured`.
- `llmProvider` is a real configured provider or routed configuration.
- Response does not include secrets, API keys or database URLs.

## 7. Mentor Quality Gate

Before inviting alpha users, run real-provider checks against staging:

```bash
APP_URL=https://staging.mentorandi.com npm run eval:models
APP_URL=https://staging.mentorandi.com npm run eval:mentor
```

Review:

- Provider success/failure.
- Routed provider and model.
- Route type and route reason.
- Latency.
- Token usage.
- Estimated cost when configured.
- Marcus tone and practical usefulness.
- Matched methods, expertise and source notes.

If Supabase or the staging database is unavailable, skip `eval:mentor` and mark Mentor Core runtime verification as pending.

## 8. Auth And Route Gate

Manually verify:

- `/login`
- `/signup`
- `/forgot-password`
- `/alpha`
- `/start`
- `/mentor`
- `/settings`
- `/admin`
- `/admin/feedback`
- `/privacy`
- `/terms`
- `/contact`
- `/api/health`

Production expectations:

- Unauthenticated `/mentor` and `/settings` redirect to login.
- Unauthenticated `/admin` and `/admin/feedback` redirect to login, non-admin
  accounts see the not-allowed state, and allowlisted admins can review the
  overview and recent feedback.
- Privacy, terms and contact pages are public and show the intended alpha wording.
- Development-only `/api/dev/*` routes are blocked.
- `/dev/mentor-test` is blocked.
- Safe errors do not expose stack traces or secrets.

## 9. Rollback Gate

Before alpha traffic:

- Record the deployed commit SHA.
- Confirm the previous known-good commit SHA.
- Confirm PM2 logs are accessible.
- Confirm the rollback command or redeploy procedure is known.
- Confirm Supabase backup/recovery ownership.

If deployment fails:

- Stop inviting users.
- Roll back to the previous known-good commit or PM2 process.
- Inspect `/api/health` and server logs.
- Do not run destructive database commands unless explicitly approved.

## 10. Alpha Go/No-Go

Go only when:

- Local checks pass.
- Server build passes.
- Health checks pass.
- Auth routes behave correctly.
- Real provider configuration is verified.
- Cost/usage guardrails are configured.
- Mentor eval has passed or DB-dependent verification is explicitly marked pending due to outage.
- Rollback path is clear.

No-go when:

- `.env` or secrets are staged.
- Generated reports are staged.
- Prisma schema changed unexpectedly.
- Package lock changed unexpectedly.
- Build or lint fails.
- Production uses `LLM_PROVIDER=mock`.
- Health endpoint exposes sensitive values.

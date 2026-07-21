# MentorAndI Deployment

## Required Environment Variables

Use `.env.example` as the deployment template. Never commit `.env` or real secrets.

```env
DATABASE_URL=
APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
LLM_PROVIDER=
LLM_DEFAULT_PROVIDER=
LLM_DEFAULT_MODEL=
LLM_DEEP_PROVIDER=
LLM_DEEP_MODEL=
LLM_CHEAP_PROVIDER=
LLM_CHEAP_MODEL=
LLM_INPUT_COST_PER_1M=
LLM_OUTPUT_COST_PER_1M=
LLM_MAX_OUTPUT_TOKENS=
LLM_CONTEXT_BUDGET_TOKENS=
LLM_RECENT_MESSAGES_LIMIT=
LLM_MEMORIES_LIMIT=
LLM_GOALS_LIMIT=
LLM_REFLECTIONS_LIMIT=
MENTOR_METHODS_LIMIT=
MENTOR_EXPERTISE_LIMIT=
MENTOR_SOURCES_LIMIT=
USAGE_LIMITS_ENABLED=
ALPHA_DAILY_MESSAGE_LIMIT=
ALPHA_WEEKLY_MESSAGE_LIMIT=
ALPHA_MONTHLY_MESSAGE_LIMIT=
ALPHA_WEEKLY_DEEP_LIMIT=
ALPHA_ADMIN_EMAILS=
ALPHA_INVITE_CODE=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_MODEL_CHEAP=
OPENAI_MODEL_DEEP=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
ANTHROPIC_MODEL_CHEAP=
ANTHROPIC_MODEL_DEEP=
```

Set `ALPHA_ADMIN_EMAILS` to a comma-separated allowlist of authenticated
Supabase user emails that may open `/admin` and `/admin/feedback`, for example:

```env
ALPHA_ADMIN_EMAILS=rene@example.com,admin@example.com
```

Keep the allowlist in deployment secrets. After changing it, rebuild or restart
the application so the server process receives the updated environment.

Set `ALPHA_INVITE_CODE` to the private code required for new alpha signups. Keep
it in deployment secrets and use the same value on every app instance. Leaving
it empty keeps signup open. Rebuild or restart after changing it.

## LLM Provider

Production should use a real provider:

- `LLM_PROVIDER=openai`
- `LLM_PROVIDER=anthropic`

`LLM_PROVIDER=mock` is for deterministic development and testing only. It is not allowed for production alpha or real users.

OpenAI mode requires working OpenAI billing/quota plus `OPENAI_API_KEY` and `OPENAI_MODEL`.
Claude mode requires `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`.

Mentor Core prepares the structured context. The real provider produces Marcus' natural response.

Before using a real provider for alpha users, test it from `/dev/mentor-test` with the development-only Real provider test. OpenAI requires working billing, quota and model access. Claude requires `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`.

Real provider usage should be monitored before alpha. Optional `LLM_INPUT_COST_PER_1M` and `LLM_OUTPUT_COST_PER_1M` values can be configured manually from current provider pricing pages so development diagnostics can estimate cost. Do not hardcode pricing into business logic.

LLM cost controls are required before alpha. If unset, MentorAndI uses conservative defaults: `LLM_MAX_OUTPUT_TOKENS=500`, `LLM_CONTEXT_BUDGET_TOKENS=6000`, `LLM_RECENT_MESSAGES_LIMIT=8`, `LLM_MEMORIES_LIMIT=5`, `LLM_GOALS_LIMIT=3` and `LLM_REFLECTIONS_LIMIT=5`. Sonnet-class models may be treated as premium/deep mode; cheaper models can be introduced later for normal daily use.

Model routing is deterministic and optional. `LLM_CHEAP_MODEL` is used for simple factual questions and lightweight daily chat, `LLM_DEFAULT_MODEL` is used for normal mentor messages, and `LLM_DEEP_MODEL` is used for deeper reflection, complexity or risk-sensitive messages. For Claude deployments, set `LLM_DEEP_MODEL` to a Sonnet-class model. If a route-specific model is missing, the provider falls back to its configured provider model.

## Supabase Auth Redirects

Set `APP_URL` to the public browser URL for the deployment, for example `APP_URL=https://staging.mentorandi.com`. Server-side auth callbacks use `APP_URL` for success and failure redirects so Docker or proxy internals such as `0.0.0.0:3000` are never sent to the browser.

Supabase Auth must allow the MentorAndI confirmation callback URL for each environment. Add these redirect URLs in the Supabase dashboard:

```text
https://staging.mentorandi.com/auth/callback
http://localhost:3000/auth/callback
```

Signup confirmation emails should return to `/auth/callback`, where the app exchanges the Supabase auth code for a session and redirects to `/start` by default. The callback keeps safe internal `next` path support for future flows.

## Pre-Deployment Checklist

For the full alpha go/no-go checklist, use `docs/ALPHA_DEPLOYMENT_CHECKLIST.md`.

Run these before deploying:

```bash
npm run check:env
npm run lint
npm run build
git status
```

Confirm production secrets are set in the deployment environment, not committed to the repository.

For VPS deployment with PM2, see `docs/VPS_DEPLOYMENT.md`.

For Docker-based Hostinger staging behind Traefik, see `docs/HOSTINGER_STAGING_RUNBOOK.md`.
Pushes to `main` deploy staging through `.github/workflows/deploy-staging.yml`
after the four required `STAGING_*` repository secrets have been configured.
Both automatic and manual staging deployment run the one-shot Compose migration
service (`prisma migrate deploy`) before rebuilding the application container.
A migration failure stops deployment before the new app version starts.
The workflow can also be started with `workflow_dispatch` and fails unless the
public health endpoint returns `status: "ok"`.

Once that server setup is complete and local SSH access is available, deploy
staging with `npm run deploy:staging`. It defaults to the local SSH config alias
`mentorandi-vps`; set `DEPLOY_HOST=user@host` to use another SSH destination.
No server secrets are stored in the command or repository.

## Post-Deployment Check

After deployment, open:

```text
/api/health
```

The response should be safe JSON and should not include secrets, database URLs or API keys.

Expected healthy values:

- `status: "ok"`
- `database: "connected"`
- `auth: "configured"`
- `llmProvider` set to the configured provider name

If `status` is `degraded`, inspect server logs and deployment environment variables.

You can also run:

```bash
npm run smoke:alpha
npm run smoke:prod
```

Before alpha, run the local mentor evaluation runner against a development or staging app to compare tone, latency, token usage and estimated cost through the existing app API:

```bash
npm run eval:mentor
```

For a deployed domain:

```bash
APP_URL=https://mentorandi.com npm run smoke:alpha
APP_URL=https://mentorandi.com npm run smoke:prod
APP_URL=https://staging.mentorandi.com EVAL_LLM_PROVIDERS=openai,anthropic npm run eval:mentor
```

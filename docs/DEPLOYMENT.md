# MentorAndI Deployment

## Required Environment Variables

Use `.env.example` as the deployment template. Never commit `.env` or real secrets.

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
LLM_PROVIDER=
OPENAI_API_KEY=
OPENAI_MODEL=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
```

## LLM Provider

Production should use a real provider:

- `LLM_PROVIDER=openai`
- `LLM_PROVIDER=anthropic`

`LLM_PROVIDER=mock` is for deterministic development and testing only.

OpenAI mode requires working OpenAI billing/quota plus `OPENAI_API_KEY` and `OPENAI_MODEL`.
Claude mode requires `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`.

Mentor Core prepares the structured context. The real provider produces Marcus' natural response.

Before using a real provider for alpha users, test it from `/dev/mentor-test` with the development-only Real provider test. Mock remains a deterministic local fallback only.

## Pre-Deployment Checklist

Run these before deploying:

```bash
npm run lint
npm run check:env
npm run build
```

Confirm production secrets are set in the deployment environment, not committed to the repository.

For VPS deployment with PM2, see `docs/VPS_DEPLOYMENT.md`.

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

For a deployed domain:

```bash
APP_URL=https://mentorandi.com npm run smoke:alpha
APP_URL=https://mentorandi.com npm run smoke:prod
```

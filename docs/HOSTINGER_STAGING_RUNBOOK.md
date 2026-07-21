# Hostinger Staging Runbook

This runbook deploys Mentor And I staging to a Hostinger VPS with the existing Traefik container.

Known Traefik setup:

- Traefik already runs in Docker.
- Traefik uses `network_mode: host`.
- Docker provider is enabled.
- `exposedByDefault=false`.
- Entrypoints are `web` and `websecure`.
- `letsencrypt` is the TLS cert resolver.
- HTTP already redirects to HTTPS.
- Staging domain is `staging.mentorandi.com`.

## Files Added For Staging

- `Dockerfile`
- `.dockerignore`
- `docker-compose.staging.yml`

The compose service is `mentorandi-staging`. It exposes port `3000` internally and relies on Traefik labels for HTTPS routing. It does not publish a host port.

## Required DNS

Point `staging.mentorandi.com` to the Hostinger VPS public IP before deploying. Traefik/Let's Encrypt must be able to reach the domain over `web` and `websecure`.

## Server-Side Env File

Create the env file on the VPS. Do not commit it.

```bash
cd /path/to/mentorandi
cp .env.example .env.staging
chmod 600 .env.staging
```

Fill `.env.staging` with staging values:

```env
DATABASE_URL=
APP_URL=https://staging.mentorandi.com
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

Important:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are needed at Docker build time and runtime.
- `APP_URL` must be the public staging URL so auth callback redirects use `https://staging.mentorandi.com`, not the internal Docker bind address.
- Use a staging Supabase project/database or an explicitly approved alpha database.
- Add `https://staging.mentorandi.com/auth/callback` to the Supabase Auth redirect URLs before testing email confirmation.
- Keep `http://localhost:3000/auth/callback` in Supabase Auth redirect URLs for local development.
- Do not use `LLM_PROVIDER=mock` for real staging validation.
- Set `ALPHA_ADMIN_EMAILS` to the comma-separated authenticated emails allowed
  to open all `/admin` routes, including `/admin/invites`.
- Create primary tester invites at `/admin/invites` after migration. Configure
  `ALPHA_INVITE_CODE` only as an emergency/development fallback.
- Keep `.env.staging` on the server only.

## Build And Start

From the repository directory on the VPS:

```bash
git fetch origin main
git checkout main
git pull --ff-only origin main
npm run check:env
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile tools build mentorandi-staging-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile tools run --rm mentorandi-staging-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
```

The one-shot migration service runs `prisma migrate deploy` and must succeed
before the application image starts using a new schema. The `--env-file
.env.staging` flag is required because Docker build args for public Supabase
values are interpolated from the compose environment. The same file is also
mounted into the services for runtime variables.

## Verify Container And Traefik

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
docker logs mentorandi-staging --tail 100
docker ps --filter name=traefik
```

Verify HTTPS health:

```bash
APP_URL=https://staging.mentorandi.com npm run smoke:prod
APP_URL=https://staging.mentorandi.com npm run smoke:alpha
```

Open:

```text
https://staging.mentorandi.com/api/health
```

Expected:

- `status` is `ok`, or any `degraded` value is understood and fixed before alpha.
- `database` is `connected`.
- `auth` is `configured`.
- `llmProvider` is a real provider or routed configuration.
- No secrets, API keys or database URLs appear in the response.

## Real Provider Verification

Run provider and Mentor Core evals against staging:

```bash
APP_URL=https://staging.mentorandi.com npm run eval:models
APP_URL=https://staging.mentorandi.com npm run eval:mentor
```

`eval:mentor` requires the staging database, seeded development user and dev test API availability. If staging runs with `NODE_ENV=production`, protected dev routes are blocked by design, so use `/api/health`, `smoke:prod`, `smoke:alpha` and real manual `/mentor` testing instead.

## Protected Dev Routes

With `NODE_ENV=production`, these must be blocked:

- `/dev/mentor-test`
- `/api/dev/*`

This is expected for public staging unless a separate access-control layer is added.

## Update Deployment

### Automatic deployment from GitHub

The workflow at `.github/workflows/deploy-staging.yml` deploys staging after
every push to `main`. It can also be run manually from **GitHub → Actions →
Deploy staging → Run workflow**. Concurrent staging deployments are serialized
so two container rebuilds do not run at the same time.

Configure these GitHub Actions repository secrets under **Settings → Secrets
and variables → Actions**:

- `STAGING_SSH_HOST`: the VPS hostname or IP address, without a username;
- `STAGING_SSH_USER`: the VPS account that owns or can operate
  `/docker/mentorandi` and Docker;
- `STAGING_SSH_KEY`: a dedicated private SSH key whose public key is authorized
  for that VPS account;
- `STAGING_APP_URL`: `https://staging.mentorandi.com`.

Setup steps:

1. Create a dedicated, automation-only SSH key pair without a passphrase for
   GitHub Actions, and do not commit either key.
2. Add the public key to the deployment account's `authorized_keys` on the VPS.
3. Add the private key and the other three values as GitHub repository secrets.
4. Confirm the VPS checkout at `/docker/mentorandi` can fetch `origin/main`
   non-interactively and that the deployment account can run Docker Compose.
5. Run the workflow manually once, confirm the migration step succeeds, and
   confirm the final health step reports `status: "ok"`.

The runner writes the private key only to its temporary `~/.ssh` directory for
the job. No SSH key, environment file, password, or application secret belongs
in the repository. The workflow host-key scan should be compared with the VPS
host fingerprint during initial setup.

### Manual fallback

To deploy `origin/main` from a local Mentor And I checkout with one command:

```bash
npm run deploy:staging
```

The command defaults to the `mentorandi-vps` alias in the local SSH config and
requires working SSH authentication for that alias. To use a different SSH
destination, set `DEPLOY_HOST` to a host or `user@host` value:

```bash
DEPLOY_HOST=deploy@example-vps npm run deploy:staging
```

The script opens a normal interactive SSH session and may prompt for the VPS
password when an SSH key is not available. It then changes to
`/docker/mentorandi`, fetches and fast-forward pulls `origin/main`, rebuilds the
staging Compose service with the server-only `.env.staging`, waits, and checks
`https://staging.mentorandi.com/api/health`. It exits unsuccessfully unless the
endpoint returns HTTP success, valid JSON, and `status: "ok"`. The script does
not contain, store, or transfer the SSH password or environment secrets.

The equivalent manual server commands remain:

```bash
git fetch origin main
git pull --ff-only origin main
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile tools build mentorandi-staging-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile tools run --rm mentorandi-staging-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
```

## Rollback

Record the previous known-good commit before deploying. To roll back:

```bash
git checkout <previous-known-good-commit>
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
docker logs mentorandi-staging --tail 100
APP_URL=https://staging.mentorandi.com npm run smoke:prod
```

Do not run destructive database commands during rollback unless explicitly approved.

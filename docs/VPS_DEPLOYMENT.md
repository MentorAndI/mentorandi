# MentorAndI VPS Deployment

This guide prepares MentorAndI for a VPS such as Hostinger KVM. It does not replace provider-specific server hardening, firewall or backup procedures.

Before inviting alpha users, complete `docs/ALPHA_DEPLOYMENT_CHECKLIST.md`.

## 1. Prepare The Server

Install a current Node.js LTS runtime, Git and PM2 on the VPS.

```bash
npm install -g pm2
```

## 2. Clone The Repository

```bash
git clone <repository-url> mentorandi
cd mentorandi
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Configure Environment

Create `.env` from `.env.example` and fill values in the VPS or deployment secret manager.

```bash
cp .env.example .env
npm run check:env
```

Never commit `.env`.

Production should use a real provider for real users:

- `LLM_PROVIDER=openai`
- `LLM_PROVIDER=anthropic`

`LLM_PROVIDER=mock` is only for development and deterministic testing. It is not allowed for production alpha or real users.

Use a production-safe Supabase `DATABASE_URL`. OpenAI and Claude keys must live in deployment secrets, not in source control.

## 5. Build

```bash
npm run build
```

## 6. Start With PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

The PM2 config runs:

```bash
npm run start
```

with `NODE_ENV=production`.

## 7. Verify Deployment

Open:

```text
/api/health
```

Then run:

```bash
npm run smoke:prod
```

For a remote domain:

```bash
APP_URL=https://mentorandi.com npm run smoke:prod
```

The health response and smoke test must never show database URLs, API keys or secret values.

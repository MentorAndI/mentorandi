# MentorAndI Alpha Progress Proof

This document is a concise inventory of working alpha capabilities and the
repository evidence behind them. It intentionally contains no fabricated
users, testimonials, growth claims, revenue claims, or usage metrics.

## Product and operational proof

| Capability | What exists now | Evidence or boundary |
| --- | --- | --- |
| VPS staging live | MentorAndI runs at `https://staging.mentorandi.com`. | The public health endpoint returned `status: "ok"` with auth configured, database connected, production environment, and OpenAI provider on July 21, 2026. No private data is exposed by that health response. |
| GitHub Actions deployment | Pushes to `main` and manual dispatch can deploy staging over SSH, rebuild Docker Compose, and verify public health. | `.github/workflows/deploy-staging.yml`; four repository secrets are required and are not committed. `npm run deploy:staging` remains the manual fallback. |
| Supabase auth and database | Email/password authentication, session resolution, PostgreSQL persistence, and Prisma repositories are integrated. | Signup/login/callback routes, Supabase server clients, Prisma schema and repositories. The health endpoint reports auth configured and database connected. |
| Resend email verification | The alpha signup flow supports verification email delivery through the current Resend/Supabase Auth setup and returns confirmation links through `/auth/callback`. | The repo implements Supabase signup, `emailRedirectTo`, code/OTP verification, and the safe callback. Resend delivery configuration is operational infrastructure outside this repository; no API key is committed. |
| Invite-code alpha gate | Signup can require a server-validated invite code before Supabase account creation. | `services/auth/alpha-signup.service.ts` and `docs/ALPHA_INVITE_GATE.md`. The gate is active only when `ALPHA_INVITE_CODE` is configured. |
| Specialized mentors | Eight alpha profiles provide distinct focus, tone, boundaries, expertise, and openings. | Life, ADHD, Relationship, Stress / Burnout, Parenting, Health & Fitness, Focus, and Confidence in the active Mentor Catalog and `/mentors`. |
| Mentor-scoped conversations | Each selected mentor loads or creates a separate owned conversation; switching profiles does not merge message history. | Mentor session services, ownership validation, stale-request protection, and `npm run test:mentor-scope`. User-level memories/goals remain shared context in v1. |
| Mentor-specific methods | Each active mentor has four curated methods, selected only from that mentor's library using the current message and lower-weight recent context. | `services/mentor-methods/` and `docs/MENTOR_METHOD_LIBRARIES.md`. At most two matches enter context and the prompt uses at most one primary intervention. |
| Admin overview | Allowlisted admins can inspect aggregate alpha activity and recent records. | `/admin` is server-rendered and checks a real Supabase user against `ALPHA_ADMIN_EMAILS`; it is not linked publicly. Counts are operational, not investor traction metrics. |
| Feedback capture | Authenticated users can submit categorized usefulness and product feedback; admins can review recent submissions. | `/api/feedback`, the feedback service/repository, in-product controls, and protected `/admin/feedback`. No public cross-user feedback API exists. |
| Usage limits | Mentor requests can enforce daily, weekly, monthly, and higher-cost-route limits. | Usage-limit service and response-route checks. Counters are currently process-local, reset on restart, and are not billing-grade analytics. |
| RLS and security hardening | Public application tables are covered by an RLS hardening script that revokes direct `anon` and `authenticated` access and rejects unrestricted policies. | `prisma/security/rls-hardening.sql` and `docs/DATABASE_SECURITY.md`; application reads go through server-side Prisma and ownership-aware services. |
| Privacy, terms, and contact | Public alpha trust and support pages exist. | `/privacy`, `/terms`, and `/contact`; these are alpha documents, not a substitute for final legal review. |
| Alpha tester instructions | Invited testers have a public guide covering signup, safe test scope, feedback, and bug reporting. | `/alpha` and `docs/ALPHA_TESTER_GUIDE.md`. |
| Investor demo page | A public, alpha-safe walkthrough presents the mentor lineup, fixed prompts, proof points, and presenter flow. | `/demo` and `docs/INVESTOR_DEMO.md`; it exposes no admin links, private data, fake users, or fake metrics. |

## What this proves

### It is not just generic chat

The user selects a defined mentor profile. The shared pipeline combines that
profile's tone and safety boundaries with relevant expertise, a mentor-specific
method, current user context, model routing, persistence, and response-quality
instructions. The output still comes from one maintainable engine.

### Specialization is substantive

MentorAndI does not rely only on renamed personas. Each active mentor owns a
four-method library. The persisted conversation's mentor determines which
library is eligible before message relevance is scored, preventing another
mentor's methods from entering that response context.

### Accounts and history persist

Supabase Auth identifies the user, while PostgreSQL/Prisma stores application
records. Conversation and message access passes through user-ownership checks.
Returning users can resume history instead of beginning with a blank chat.

### Mentor contexts remain separate

ADHD and Confidence can belong to one user while retaining different
conversation threads. Server-side mentor matching and client-side stale-request
protection prevent a switch from attaching or displaying the wrong thread.

### A feedback loop exists

Authenticated alpha users can send structured feedback inside the product.
Allowlisted internal admins can review it and use it to prioritize alpha
improvements without exposing a public feedback database.

### A real deployment exists

The app is running behind HTTPS on Hostinger VPS staging. The automated deploy
path pulls only a fast-forward update from `main`, rebuilds the staging
containers, waits, and checks the public health endpoint. This proves an
operational delivery path, not scale or uptime history.

### The security foundation has started

Authentication, server-side user resolution, ownership enforcement,
mentor-scoped conversations, RLS hardening, blocked direct browser table
access, allowlisted admin routes, production-blocked development routes, usage
limits, and basic account privacy controls are present. Further security,
privacy, compliance, monitoring, and incident-response work remains part of
moving beyond alpha.

## Current boundaries

- This is a private alpha, not a finished clinical, compliance, or commercial
  platform.
- MentorAndI is mentoring support, not therapy, diagnosis, emergency support,
  medical advice, legal advice, or financial advice.
- Usage counters are not persistent and should not be presented as analytics.
- User-level memories, goals, and reflections are shared across the user's
  mentors in v1; conversation messages remain mentor-scoped.
- The public pages contain no private admin data. Admin proof must be shown only
  from an authorized account in a controlled presentation.

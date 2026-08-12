# Codex Task Backlog

This document is the repo-readable backlog for upcoming Mentor And I implementation work. Future Codex prompts may be short, for example:

`Implement Feature 086 from docs/CODEX_TASKS.md.`

## How Codex Should Work

1. Read `AGENTS.md` first.
2. Read `docs/PROJECT_STATUS.md`.
3. Read `docs/ARCHITECTURE.md`.
4. Then implement the requested feature from `docs/CODEX_TASKS.md`.
5. Do not invent major architecture changes.
6. Do not change the Prisma schema unless the feature explicitly says so.
7. Do not add packages unless explicitly needed.
8. Run verification commands before finishing:

```bash
npm run check:env
npm run lint
npm run build
```

Implement only the named feature unless the user explicitly asks for more.

## Upcoming Feature Backlog

### Feature 086 - Aggregate Learning Suggestions v1

Status:
Foundation added. The service interface and documentation exist, but aggregate learning remains disabled and no cross-user implementation exists.

Goal:
Create a safe design foundation for detecting repeated themes across users without storing personal user data as shared knowledge.

Rules:

- No Prisma schema changes yet.
- No cross-user learning implementation yet.
- Documentation and service interface only.
- Shared knowledge must be curated/admin-approved.
- Personal user memory must never become shared knowledge automatically.

### Feature 087 - Usage Limits v1

Status:
Foundation added. Request counts are tracked in memory and mentor response routes can enforce configured daily/monthly limits without requiring database persistence.

Goal:
Add basic usage and cost guardrails before alpha.

Rules:

- Track request counts in memory/service layer first if database is unavailable.
- Later persist usage to database.
- Do not block local dev.
- Production should support daily/monthly usage limits.

### Feature 088 - Full Mentor Evaluation Runner

Status:
Runner added. `npm run eval:mentor` exercises the full Mentor Core flow through the development API and writes `reports/mentor-eval-latest.json`.

Goal:
Evaluate the full Mentor Core flow, not just raw providers.

Requires:

- Database connected.
- Seeded dev user.
- Model routing.
- Methods/expertise/source libraries.

### Feature 089 - Alpha Deployment Checklist

Status:
Checklist added. `docs/ALPHA_DEPLOYMENT_CHECKLIST.md` is the alpha deployment go/no-go checklist for Hostinger/VPS.

Goal:
Prepare final deployment checklist for Hostinger/VPS.

### Feature 090 - Alpha Staging Deployment

Goal:
Deploy staging version and verify health, auth, real provider, and protected dev routes.

### Feature 096 - Charisma Mentor Teaching System

Status:
Documentation complete. The Charisma Mentor teaching contract, method library,
expertise model, progression, safety boundaries, and future evaluation scenarios
are specified. No runtime mentor, database, payment, Prisma, or package changes
were made.

Goal:
Create a dedicated Charisma Mentor that teaches ethical charisma as a learnable
skill through lessons, demonstrations, drills, feedback, real-world practice,
and follow-up. This is a new teaching/training mentor, not the Confidence Mentor
renamed and not a system for manipulation, dominance, pickup tactics, or a fake
personality.

### Feature 096B - Charisma Mentor Runtime And Portrait Alignment

Status:
Implemented. Charisma replaces Confidence in the active runtime catalog and is
wired through selection, prompting, methods, expertise, demo/evaluation data,
and plan enforcement. Existing conversations remain compatible through the
legacy internal `confidence` database slug. Locked mentor responses show the
required denial and a `/pricing` upgrade link. Feature 096C subsequently
confirmed and restored the approved source portraits already tracked in
`public/images/mentors/`.

Goal:
Align runtime mentor selection with the public product direction without
inventing portraits, weakening access checks, or requiring a Prisma migration.

### Feature 096C - Restore Approved Mentor Portraits

Status:
Implemented. Runtime mentor cards, profile pages, and conversation headers use
the eight approved repository portraits in `public/images/mentors/`. Joyce's
approved portrait is shared with Charisma because the public website uses the
former Confidence portrait for the Charisma card. Pricing CTA route targets are
documented in `docs/MENTOR_PORTRAIT_ASSETS.md`; no pricing or payment behavior
was changed.

Goal:
Restore the existing approved website portrait set through local Next.js public
asset paths that work in development and production/Docker builds.

### Feature 096E - Import Canonical Website Mentor Portraits

Status:
Implemented. The 8 card and 8 profile WebPs from
`MentorAndI/mentorandi-website@main` are stored locally under
`public/images/mentors/cards/` and `public/images/mentors/profiles/`. Active
mentor compact UI uses the card assets, while mentor detail pages use the
profile assets. The old short PNGs and source masters are not referenced by
active mentor UI.

Goal:
Use the exact approved public-website portraits locally in the Next.js app and
Docker build without hotlinking or changing Joyce's approved Confidence-based
asset filename.

### Feature 097 - Alpha Feedback Capture

Status:
Implemented. Authenticated alpha users can submit categorized usefulness feedback from `/start` and `/mentor`; submissions are stored per user through the server-side Feedback service and Prisma repository.

Goal:
Capture lightweight usefulness, bug and product feedback before expanding the alpha.

### Feature 098 - Internal Alpha Feedback Admin View

Status:
Implemented. Authenticated admins allowlisted through `ALPHA_ADMIN_EMAILS` can
review the 100 most recent feedback submissions at `/admin/feedback` through a
server-rendered Prisma read.

Goal:
Review alpha feedback without using manual Supabase SQL or exposing a public
feedback read API.

### Feature 099 - Personal Psychology Alpha Mentor Lineup

Status:
Implemented. Marcus is positioned as the Life Mentor, and the active alpha
support lineup is Life, ADHD, Relationship, Stress / Burnout, Parenting, Health
& Fitness, Focus and Charisma.

Goal:
Move Mentor And I away from Business/Career mentor positioning and toward
personal, relational and executive-function support without breaking existing
Marcus conversations.

### Feature 100 - Alpha Legal, Privacy And Contact Pages

Status:
Implemented. Public `/privacy`, `/terms` and `/contact` pages provide simple
alpha trust information, with unobtrusive footer links and optional support
email configuration.

Goal:
Give invited alpha users clear privacy, usage-limit and contact information
before broader testing.

### Feature 100B - Improve Alpha Contact Page

Status:
Implemented. `/contact` provides a direct alpha support email, points logged-in
users to in-product feedback and explains what to include in a bug report.

Goal:
Give alpha users practical support and feedback paths without adding a public
contact form or database persistence.

### Feature 101 - Improve Marcus Mentor Response Quality

Status:
Implemented. Marcus's prompt contract now defaults to warm conversational
prose, reflects the user's specific tension, uses at most one tentative pattern
and one concrete next step, and ends personal mentoring responses with exactly
one strong follow-up question.

Goal:
Make Marcus feel like a personal psychological Life Mentor instead of generic,
list-heavy ChatGPT advice while preserving safety and Mentor Core context.

### Feature 101B - Warm Up Marcus Mentor Tone

Status:
Implemented. Marcus now usually gives one short, grounded affirmation before
naming a pattern or suggesting action, and the mentor eval checks warmth across
focus, stress, self-doubt, relationship conflict and ADHD task initiation.

Goal:
Make Marcus warmer, more personal, encouraging and emotionally present without
pretending to be human, becoming therapist-like or drifting into romantic AI
companion behavior.

### Feature 102 - Alpha Admin Overview

Status:
Implemented. Allowlisted authenticated admins can view aggregate activity,
recent users and conversations, feedback summaries and available process-local
usage counters at `/admin`, with navigation to `/admin/feedback`.

Goal:
Provide a simple internal view of early alpha activity without SQL, public admin
APIs, client-only authorization or database schema changes.

### Feature 103 - Pricing, Plans And Mentor Credits Model

Status:
Documentation complete. The planned Free Trial, Single Mentor, Mentor Plus,
Premium, and Company Stress Mentor prices and access boundaries are defined,
along with user-facing credits, future server-side enforcement, upgrade logic,
privacy constraints, and the division between Stripe billing and MentorAndI
entitlements. No payment, schema, package, or runtime changes were made.

Goal:
Define a sustainable paid-access model in which plans control mentor access and
mentor credits fund bounded product usage without exposing provider tokens or
claiming unlimited use.

Rules:

- Stripe handles payment, subscription state, Checkout, and signed webhooks.
- MentorAndI handles plan access, mentor locks, credits, and the usage ledger.
- UI locks are explanatory only; future enforcement must be server-side.
- Employer customers never receive individual Company Stress Mentor chats.
- Do not implement payments or change the Prisma schema in this feature.

### Feature 103A - Alpha Invite Gate (Legacy Feature 103)

Status:
Implemented. Signup accepts an optional invite code and validates it on the
server before calling Supabase whenever `ALPHA_INVITE_CODE` is configured.

Goal:
Restrict new alpha accounts to invited testers without exposing the configured
code to client bundles or affecting login, existing users or email confirmation.

### Feature 104 - Plan-Based Mentor Access Enforcement Foundation

Status:
Implemented. A central policy represents free, single-mentor, Plus, Premium,
and Company Stress access; mentor session creation/loading and both mentor
response API paths enforce the resolved user's mentor access server-side before
model work. Missing or inactive subscriptions default to Free in production and
staging, never Premium; local development uses a non-Premium Plus test default.

Goal:
Prevent users from accessing mentors outside their plan through direct API or
conversation requests while billing, credits, deep-session metering, and UI
locks remain future work.

Current schema note:
The legacy subscription enum cannot represent `single_mentor`, `plus`, or
`company_stress`, and it has no selected-specialist or company-seat field. The
foundation safely maps active legacy Alpha/Personal to Plus for alpha/test
compatibility, Free to Free, Premium/Founder to Premium, and everything inactive
or missing to Free. A later reviewed migration is required before new plans are
sold or assigned.

### Feature 104A - Alpha Tester Instructions (Legacy Feature 104)

Status:
Implemented. The public `/alpha` page gives invited testers a signup-to-feedback
checklist, low-risk testing guidance, safety boundaries, bug-report format and
links to the relevant public account and trust pages.

Goal:
Help invited users test Mentor And I consistently and safely without exposing
internal admin pages or adding persistence.

### Feature 105 - Specialized Mentor System v1

Status:
Implemented. `/mentors` presents eight active alpha profiles, and validated
profile selection specializes the shared Mentor Core prompt, expertise, tone,
and boundaries without changing the database model or existing user context.

Goal:
Make the alpha lineup visibly distinct and demo-ready while preserving one
secure conversation engine, current memory behavior, and safety boundaries.

### Feature 105B - Separate Conversations By Mentor

Status:
Implemented. Each active profile maps to a persisted Mentor record and an
authenticated user's selected mentor loads or creates an isolated conversation
history. Legacy Marcus conversations remain Life conversations.

Goal:
Make mentor switching feel like moving between distinct mentor spaces without
mixing messages or weakening user ownership checks.

### Feature 105C - Harden Mentor-Scoped Conversations

Status:
Implemented. Mentor switches now remount and lock the conversation client,
abort stale history requests, and ignore responses from the previous mentor.
A database-backed regression test verifies Charisma, ADHD, and legacy Life
messages remain isolated.

Goal:
Prevent an older asynchronous history response from overwriting the newly
selected mentor thread.

### Feature 106 - Investor Demo Flow

Status:
Implemented. The public `/demo` page presents five investor-ready scenarios,
routes each card into its validated mentor context, and explains the
implemented alpha product foundation without exposing admin links or fake
metrics.

Goal:
Show Mentor And I as one secure Mentor Core with distinct specialized mentor
experiences while preserving mentor-scoped conversations.

### Feature 110B - Grounded Mentor Encouragement

Status:
Implemented. Personal mentor responses vary validation, recognize a specific
strength evidenced in the user's message, and avoid stock or cheesy praise. The
mentor evaluation penalizes repeated stock validation, generic openings, and
personal advice that lacks grounded encouragement.

Goal:
Make specialized mentor responses feel more encouraging and human without
becoming generic, flattering, or unsafe.

### Feature 111 - Investor Proof Pack

Status:
Implemented. The repository includes a 5–7 minute investor demo script and a
direct alpha capability inventory with evidence, limitations, and no invented
metrics or public admin exposure.

Goal:
Give investors and OTC viewers a concise, verifiable explanation of the working
Mentor And I alpha, its operational product loop, and its current boundaries.

### Feature 112 - Persistent Usage And Cost Monitoring v1

Status:
Implemented. Successful, failed, and blocked mentor usage is persisted with
safe provider/model/token/cost metadata; production limits query UTC database
windows and fail closed; allowlisted admins can inspect `/admin/usage`.

Goal:
Make alpha volume, estimated cost, and limit enforcement durable across app
restarts without treating operational estimates as billing-grade analytics.

### Feature 107 - One-Command Staging Deploy

Status:
Implemented. `npm run deploy:staging` securely connects to the configured VPS,
fast-forward pulls `origin/main`, rebuilds the staging Compose service, and
fails unless the public staging health endpoint returns `status: "ok"`.

Goal:
Make the established staging deployment repeatable without copying long SSH
commands or placing deployment secrets in the repository.

### Feature 108 - Investor Demo Script And Proof Page Polish

Status:
Implemented. `/demo` now includes a 5–7 minute, eight-step presenter script,
concise investor proof statements, the five fixed mentor prompts, and a “What
this proves” section without fake metrics or public admin links.

Goal:
Make the working specialized-mentor, persistent-history, feedback, safeguards,
and VPS staging story easy to demonstrate consistently.

### Feature 109 - Automatic Staging Deploy Via GitHub Actions

Status:
Implemented. Pushes to `main` and manual workflow dispatches use repository
secrets to update the Hostinger staging Compose service, serialize deployments,
and fail unless the public health endpoint returns `status: "ok"`.

Goal:
Deploy reviewed `main` updates to staging consistently while retaining
`npm run deploy:staging` as the local fallback and keeping secrets out of Git.

### Feature 110 - Mentor-Specific Method Libraries v1

Status:
Implemented. Every active alpha mentor has four curated practical methods. The
Context Builder filters by the persisted selected mentor, ranks relevance from
the current and recent mentor-scoped messages, and includes at most two methods
while the prompt uses at most one natural intervention.

Goal:
Make specialization substantive without list-heavy responses, weakening safety
boundaries, or losing Marcus's warm personal mentoring response contract.

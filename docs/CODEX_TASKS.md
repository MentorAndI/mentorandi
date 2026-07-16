# Codex Task Backlog

This document is the repo-readable backlog for upcoming MentorAndI implementation work. Future Codex prompts may be short, for example:

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
& Fitness, Focus and Confidence.

Goal:
Move MentorAndI away from Business/Career mentor positioning and toward
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

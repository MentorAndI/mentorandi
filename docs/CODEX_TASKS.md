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

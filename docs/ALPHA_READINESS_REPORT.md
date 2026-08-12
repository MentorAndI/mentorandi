# External Alpha Readiness Report

## Decision

**Automated gate: PASS. External-tester go-live: CONDITIONAL PASS.**

The build, public staging surface, logged-out security boundaries, health
configuration, plan policy, mentor identity, and database-backed mentor
isolation pass the automated gate. A blocker found during the audit—public
pages still claiming that signup required an invite code—was corrected without
changing pricing, payments, subscriptions, or entitlements.
The dependency audit also found that Next.js `16.2.9` was within the affected
range of a published App Router proxy-bypass advisory. Because authentication
redirects run through `proxy.ts`, Next.js was updated to the audit-recommended
`16.3.0` security release and the full gate was rerun.

Do not begin broad external invitations until one release owner completes the
human-only authenticated checklist below with a fresh email-confirmed Free
Trial account. No tester credentials or mailbox access were available to this
Codex session, so those steps are not represented as automated passes.

Evaluation date: 2026-08-12

Target: `https://staging.mentorandi.com`

Branch: `main`

## Automated Results

| Area | Result | Evidence |
| --- | --- | --- |
| Environment and production build | PASS | `npm run check:env`, `npm run lint`, and `npm run build` |
| Framework security baseline | PASS | Next.js `16.3.0`; the direct Next.js proxy-bypass and related Next/sharp/PostCSS advisories are absent after the update |
| Public staging routes | PASS | Signup, login, alpha, demo, pricing, mentors, start, privacy, terms, contact, and health return expected content/status |
| Signup boundary | PASS | Signup accepts email/password fields; invalid input returns `400` without an invite-code requirement |
| Auth redirects | PASS | Mentor, onboarding, feedback, settings, and admin routes redirect logged-out users to login with a safe `next` path |
| Auth callback failure | PASS | Missing/invalid callback credentials return safely to login without exposing provider errors |
| Protected APIs | PASS | Current-user, conversations, Life session, new mentor session, and feedback APIs reject logged-out access |
| Development route isolation | PASS | `/dev/mentor-test` returns `404` against a production target |
| Mentor selection surface | PASS | The public lineup contains Life Mentor and Charisma Mentor and routes through protected mentor entry |
| Plan access policy | PASS | Free is Life-only; Single, Plus, Premium, and Company Stress policies retain their defined boundaries; missing production subscriptions fail down to Free |
| Locked mentor contract | PASS | Stable `403` copy and upgrade message remain covered by the mentor-access regression |
| Mentor identity | PASS | Specialist persona names and Marcus/Life labels remain correctly separated |
| Mentor-scoped isolation and resume | PASS | Database-backed regression creates Charisma, ADHD, and legacy Life threads, proves distinct histories, and resolves the same thread on return |
| Specialist runtime | PASS | All eight specialist packs parse and retain selection, safety, and prompt-budget checks |
| Feedback boundary | PASS | `/feedback` is protected and anonymous `POST /api/feedback` returns `401`; admin feedback remains under the admin route boundary |
| Admin route boundary | PASS | `/admin`, `/admin/feedback`, and `/admin/usage` require authentication; application services retain email allowlisting for cross-user reads |
| Health and secrets | PASS | Health reports production, connected database, configured auth, real provider, and `status: ok`; response contains no secret field names |
| Public trust pages | PASS | Privacy, terms, contact, alpha instructions, and support address are reachable and contain expected safety/support wording |

The reusable HTTP gate is:

```bash
NODE_ENV=production \
APP_URL=https://staging.mentorandi.com \
npm run alpha:readiness
```

It is read-only: it does not create users, conversations, feedback, payments,
or subscriptions.

## Findings

### BLOCKER

**Resolved — public invite-gate contradiction.** `/alpha` and `/pricing` told
external testers that an invite code was required even though signup no longer
accepts one. The copy now directs testers to create an account and verify their
email. The readiness command prevents the obsolete wording from returning.

**Resolved — framework proxy-bypass advisory.** The audit reported Next.js
`16.2.9` in the affected range for an App Router middleware/proxy bypass. This
was directly relevant to protected route enforcement. The existing dependency
was updated to `16.3.0`; no package was added, and auth, build, smoke, and
readiness regressions pass on the updated framework.

No unresolved automated blocker remains.

### IMPORTANT

**Human authenticated journey remains required before invitations.** Complete
the checklist below with a fresh staging account. These are release-verification
steps, not known defects.

**Legal/product-owner review remains required.** The public privacy and terms
pages are deliberately simple alpha wording and explicitly are not final legal
documents. A release owner should confirm they are acceptable for the intended
tester geography and cohort.

**Prisma CLI dependency advisories remain for maintenance.** After the Next.js
update, `npm audit --omit=dev` still reports advisories that `npm explain`
traces only through the `prisma` CLI and its `@prisma/dev` dependency chain.
They are not part of the standalone web runner and are not exposed as an HTTP
service; the CLI runs only in controlled build/migration workflows. Track the
next compatible Prisma maintenance update, but do not treat this tooling-only
chain as an external-alpha blocker.

### POLISH

The UI is functional alpha quality rather than final design. No redesign was
performed. Minor wording and visual refinements can follow without blocking a
small, supervised alpha after the authenticated checklist passes.

## Human-Only Authenticated Checklist

Use a new email address that can receive the Supabase confirmation message.
Do not use a production customer or an admin account for the first pass.

1. Open `/signup?plan=free`, create the account, and confirm that the email
   arrives and links back to the staging `/auth/callback` route.
2. Confirm the callback establishes a session and continues to `/onboarding`.
   Verify that a plan query does not grant paid access.
3. Select Life Mentor, send a low-risk message, and confirm a useful real-model
   response appears without a provider or usage-tracking error.
4. Select a specialist mentor and confirm the Free account receives the locked
   mentor message and upgrade action, while Life Mentor remains available.
5. Send a second Life message, log out, log in again, return to Life Mentor,
   and confirm the same conversation and messages resume.
6. If a paid alpha fixture is intentionally available, verify two mentor
   histories remain separate in the browser in addition to the passing
   database regression. Do not grant broad paid access for this check.
7. Submit `/feedback` with a rating, category, page, and mentor. Confirm the
   exact success message: “Thanks — your feedback was saved.”
8. With a normal non-admin account, open `/admin`, `/admin/feedback`, and
   `/admin/usage`; confirm the not-allowed state and no cross-user data.
9. With an allowlisted admin, confirm the feedback appears at
   `/admin/feedback` and the successful mentor request appears at
   `/admin/usage` without message content or secrets.
10. Log out and confirm mentor, feedback, settings, and admin pages return to
    login and protected APIs return `401`.

## Scope And Data Changes

Feature 113 adds regression/readiness coverage and corrects obsolete public
alpha wording. It updates the existing Next.js dependency from `16.2.9` to
`16.3.0` to remove a proxy-bypass security blocker; it does not add a package.
It does not change the Prisma schema, Stripe, pricing values, subscription
records, usage limits, mentor prompts, or production configuration. The
database-backed isolation test creates random fixture data and removes it in its
cleanup hook.

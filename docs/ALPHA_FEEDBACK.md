# Alpha Feedback Capture

## User Flow

Authenticated testers can open `/feedback` from the mentor navigation, account
settings, or the floating Feedback entry on `/start` and `/mentor`. Links from
the mentoring flow prefill the current page and selected mentor when available.

The short form captures:

- category: bug, confusing, mentor quality, onboarding, pricing, or other;
- an optional 1–5 rating;
- a required message;
- optional page or context;
- an optional active mentor slug.

After a successful submission the form shows: “Thanks — your feedback was
saved.”

## Storage And Security

`POST /api/feedback` validates every field, resolves a real Supabase-authenticated
user with no development fallback, and passes the owned write through the
Feedback service and Prisma-only repository. Each `Feedback` row keeps its
`userId`; no public or user-facing feedback read, update, or delete endpoint
exists.

The `Feedback` table remains protected from browser-facing Supabase roles by RLS
and revoked `anon` and `authenticated` grants. Logged-out submissions return
`401`, and `/feedback` redirects logged-out visitors to login.

The existing legacy usefulness enum remains for older submissions. New forms
store the requested optional numeric rating in `ratingScore`; a database check
allows only 1 through 5. `mentorSlug` is optional. The legacy `IDEA` category is
retained for existing data and rolling-deploy compatibility but is not shown in
the Feature 097 form.

## Internal Review

Feedback is not public. Authenticated administrators allowlisted through
`ALPHA_ADMIN_EMAILS` can review the 100 most recent submissions at
`/admin/feedback`. The admin view includes numeric rating, category, mentor,
message, page context, submission time, and user email. A broader moderation or
workflow UI can be added later without exposing a cross-user public API.

## Database Migration

Migration `20260812120000_extend_alpha_feedback_capture` adds the two category
values, nullable `ratingScore` and nullable `mentorSlug`, plus a 1–5 check. It
does not remove or rewrite existing feedback. Staging deployment runs the
one-shot Prisma migrator before replacing the app container.

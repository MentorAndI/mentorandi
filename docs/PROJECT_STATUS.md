# MentorAndI Project Status

## Product Name

MentorAndI

## Current Status

- Local alpha.
- Next.js app running locally.
- Supabase, PostgreSQL and Prisma are connected.
- Mentor Core foundation is working with centralized LLM provider selection.
- Marcus uses a warm, conversational personal-mentor response contract that
  validates the user's specific situation and discourages generic advice lists,
  stock assistant language and multiple follow-up questions.
- Aggregate Learning Suggestions v1 exists as a disabled design/service-interface foundation only; no cross-user learning is implemented.
- Usage Limits v1 exists as an in-memory request-count foundation for mentor responses; database persistence is still future work.
- Authenticated alpha feedback capture is available from `/start` and `/mentor`.
- Allowlisted internal admins can monitor aggregate and recent alpha activity at
  `/admin` and review recent feedback at `/admin/feedback`.
- Public alpha privacy, terms and contact pages are available, with direct
  support, in-product feedback and bug-report guidance on `/contact`.
- The active alpha mentor lineup is Life, ADHD, Relationship, Stress / Burnout,
  Parenting, Health & Fitness, Focus and Confidence; Business and Career are not
  active mentor categories.
- Full Mentor Evaluation Runner exists for dev-only Mentor Core evaluation through the seeded database-backed flow.
- Alpha Deployment Checklist exists for Hostinger/VPS go/no-go review.
- Mock mode is available for deterministic local testing.
- OpenAI and Claude provider modes are the intended paths for real mentor response quality.

## Current User Flows

- `/start` first conversation experience.
- `/mentor` main mentor experience.
- `/dev/mentor-test` development test page.
- `/privacy`, `/terms` and `/contact` alpha trust pages.

## Core Systems Built

- Supabase Auth foundation.
- Optional server-side alpha invite gate for new signups.
- Prisma database models.
- User resolution.
- Conversation ownership and user isolation.
- Conversation list and resume.
- New conversation flow.
- Message storage.
- Memory extraction.
- Memory dedupe.
- Goal extraction.
- Active goals in UI.
- Reflection engine.
- Personal-psychology Mentor Expertise profiles for the active alpha lineup.
- Alpha feedback capture with usefulness rating, category and page context.
- Server-rendered alpha admin overview and feedback review.
- Reflection-aware context.
- Basic account data export and mentor data deletion controls.
- Context Builder.
- Prompt Composer.
- Response Pipeline.
- LLM provider adapter.
- Mock provider for deterministic development testing.
- OpenAI provider mode using the structured Mentor Core prompt contract.
- Anthropic/Claude provider mode using the structured Mentor Core prompt contract.

## Important Behavior Rules

- Current user message has priority.
- Recent context only dominates when the current message is a clear follow-up.
- Memories are user-level.
- Goals are user-level.
- Reflections are user-level.
- Conversations are user-scoped.
- Development fallback user is allowed only outside production.
- Development fallback user is blocked in production; missing authenticated users must receive `401`.
- Feedback always requires a real authenticated user; the development fallback user is never accepted.
- `/api/dev/*` routes and `/dev/mentor-test` are development-only and blocked in production.
- Raw IDs are not exposed in user-facing UI.
- `LLM_PROVIDER=mock` is safe for deterministic local testing only and is not allowed for production alpha.
- `LLM_PROVIDER=openai` runs Marcus through the OpenAI provider using structured Mentor Core context.
- `LLM_PROVIDER=anthropic` runs Marcus through the Anthropic/Claude provider using structured Mentor Core context.
- Production alpha requires explicit real LLM provider configuration with `openai` or `anthropic`.
- Real provider modes require their API key and model environment variables.
- Mentor Core prepares context; the selected real LLM provider produces the natural-language answer.
- Mock should not be treated as the source of real mentor quality.
- Aggregate learning suggestions are not active runtime behavior. Personal user data must never become shared knowledge automatically, and reusable knowledge changes must remain curated/admin-approved.
- Usage limits are enforced only when configured, with local development left unblocked by default. Current counts are process-local and reset on restart.
- `npm run eval:mentor` requires the local app server, database connection and seeded development user because it evaluates the full Mentor Core flow.

## Alpha Auth Behavior

- `/login`, `/signup` and `/forgot-password` are public auth pages.
- `/signup` requires a matching invite code only when `ALPHA_INVITE_CODE` is
  configured; invalid codes are rejected before Supabase signup is called.
- Successful login redirects to `/mentor`.
- Successful signup either creates an immediate session and redirects to `/start`, or shows email confirmation instructions. Email confirmation links return through `/auth/callback` to create the session and continue to `/start`.
- Sign out clears the Supabase session and sends the user to `/login`.
- In development, `/mentor` and `/settings` may use the seeded fallback user when no Supabase session exists.
- In production, unauthenticated users are redirected from `/mentor` and `/settings` to `/login`.
- Auth form errors use safe user-facing messages and must not expose provider internals or stack traces.

## Known Limitations

- OpenAI and Anthropic provider modes exist, but API keys, billing and quota may still need verification in the active environment.
- Mock provider is deterministic and useful for local testing, but it is not representative of final mentor quality.
- Memory, goal and reflection extraction is rule-based.
- UI is functional but not final design.
- Deployment is not done.
- Payment is not done.
- Privacy controls are basic v1 only; Supabase auth user deletion and full compliance workflows are not done.
- Usage limits are not yet persisted to the database.

## Current Test Checklist

- `npm run lint`
- `npm run build`
- `/start` works.
- `/mentor` works.
- `/dev/mentor-test` works.
- New conversation works.
- Conversation resume works.
- Memory dedupe works.
- Goals appear in mentor UI.
- Reflections influence later context without overriding topic shifts.
- Mock diagnostics show selected provider, provider used and safe provider error state.
- OpenAI and Anthropic modes should be tested when API keys, models, billing and quota are available.
- `/settings` account data export and mentor data deletion work for the resolved user only.

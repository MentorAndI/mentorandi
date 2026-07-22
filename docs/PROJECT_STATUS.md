# Mentor And I Project Status

## Product Name

Mentor And I

## Current Status

- Local alpha.
- Next.js app running locally.
- Supabase, PostgreSQL and Prisma are connected.
- Mentor Core foundation is working with centralized LLM provider selection.
- Marcus uses a warm, conversational personal-mentor response contract that
  validates the user's specific situation and discourages generic advice lists,
  stock assistant language and multiple follow-up questions.
- Personal mentor responses vary their validation and usually add one positive
  reflection grounded in the user's effort, honesty, awareness, courage,
  pattern recognition, or willingness instead of relying on stock reassurance.
- Aggregate Learning Suggestions v1 exists as a disabled design/service-interface foundation only; no cross-user learning is implemented.
- Usage and cost monitoring persists safe mentor-request metadata, token usage,
  estimated cost, failures, and blocked attempts. Alpha limits query successful
  usage in UTC periods instead of relying on process memory in production.
- Authenticated alpha feedback capture is available from `/start` and `/mentor`.
- Allowlisted internal admins can monitor aggregate and recent alpha activity at
  `/admin` and review recent feedback at `/admin/feedback`.
- Public alpha privacy, terms and contact pages are available, with direct
  support, in-product feedback and bug-report guidance on `/contact`.
- A public `/alpha` entry page explains the invited tester flow, safety
  boundaries, test checklist and feedback format, then shows session-aware
  signup/login or mentor-start actions without exposing admin routes.
- The active alpha mentor lineup is Life, ADHD, Relationship, Stress / Burnout,
  Parenting, Health & Fitness, Focus and Confidence; Business and Career are not
  active mentor categories.
- `/mentors` lets users preview and select those eight distinct profiles. The
  selection safely specializes the shared Mentor Core and loads a separate
  persisted conversation history for that mentor.
- `/demo` provides an investor-friendly private-alpha overview, a 5–7 minute
  presenter script, proof points, and five fixed prompt scenarios that open the
  matching mentor.
- `/pricing` describes invite-only Alpha and adjustable planned Personal and
  Premium tiers. Payments remain disabled unless the explicit Stripe flag and
  complete server configuration are present.
- Stripe Checkout, Customer Portal, and signed subscription webhooks can be
  exercised end to end on staging in test mode only. Live secret keys and live
  webhook events are rejected during alpha; setup is documented in
  `docs/STRIPE_STAGING_SETUP.md`.
- `docs/INVESTOR_DEMO_SCRIPT.md` and `docs/ALPHA_PROGRESS_PROOF.md` provide a
  presenter-ready walkthrough and evidence-based alpha capability inventory.
- Full Mentor Evaluation Runner exists for dev-only Mentor Core evaluation through the seeded database-backed flow.
- Alpha Deployment Checklist exists for Hostinger/VPS go/no-go review.
- One-command staging deployment is available through `npm run deploy:staging`
  for operators with configured VPS SSH access.
- GitHub Actions automatically deploys pushes to `main` to Hostinger staging
  once the required repository secrets and dedicated SSH key are configured.
- Mock mode is available for deterministic local testing.
- OpenAI and Claude provider modes are the intended paths for real mentor response quality.

## Current User Flows

- `/start` first conversation experience.
- `/mentor` main mentor experience.
- `/dev/mentor-test` development test page.
- `/privacy`, `/terms` and `/contact` alpha trust pages.
- `/alpha` invited tester instructions.
- `/mentors` active alpha mentor selection and preview.
- `/demo` investor and product demonstration flow.

## Core Systems Built

- Supabase Auth foundation.
- Database-backed alpha invites with email/expiry/use controls, one-time code
  display, revocation, and an emergency environment-code fallback.
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
- Active Mentor Catalog with distinct persona prompts, tones, boundaries, and
  example openings for all eight alpha specializations.
- Four-method specialist libraries for each active mentor, selected only within
  the persisted mentor context; default prompts carry one primary method.
- Alpha feedback capture with usefulness rating, category and page context.
- Server-rendered alpha admin overview and feedback review.
- Allowlisted `/admin/usage` monitoring for persistent counts, estimated cost,
  24-hour/7-day average input and output tokens, provider/model/mentor
  breakdowns, blocked attempts, and recent events.
- Allowlisted `/admin/invites` management for hashed, expiring,
  email-restricted, usage-limited, and revocable alpha invites.
- Server-only subscription records, Stripe checkout/portal/webhook preparation,
  plan-aware entitlements, and allowlisted `/admin/billing` visibility.
- Compact default prompt composition with a 1,800-token context budget,
  relevance-filtered personal context, four recent messages, conditional
  environment context, and non-duplicated safety/response instructions.
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
- Usage limits are enforced only when configured, with local development left
  unblocked by default. Production/staging reads persistent usage and fails
  closed when tracking is unavailable; local development may use a process-local
  fallback.
- `npm run eval:mentor` requires the local app server, database connection and seeded development user because it evaluates the full Mentor Core flow.

## Alpha Auth Behavior

- `/login`, `/signup` and `/forgot-password` are public auth pages.
- `/signup` requires an active database invite; revoked, expired, exhausted, and
  email-mismatched invites are rejected before Supabase signup. Invite use is
  recorded after Supabase and local user creation. `ALPHA_INVITE_CODE` is an
  emergency/development fallback only.
- Successful login redirects to `/mentor`.
- Successful signup either creates an immediate session and continues to mentor
  selection, or shows email confirmation instructions. Email confirmation links
  return through `/auth/callback` and continue to `/mentors` by default. Safe
  requested `/start` or mentor destinations are preserved.
- Sign out clears the Supabase session and sends the user to `/login`.
- In development, `/mentor` and `/settings` may use the seeded fallback user when no Supabase session exists.
- In production, unauthenticated users are redirected from `/mentor` and `/settings` to `/login`.
- Auth form errors use safe user-facing messages and must not expose provider internals or stack traces.

## Known Limitations

- OpenAI and Anthropic provider modes exist, but API keys, billing and quota may still need verification in the active environment.
- Mock provider is deterministic and useful for local testing, but it is not representative of final mentor quality.
- Memory, goal and reflection extraction is rule-based.
- UI is functional but not final design.
- Hostinger VPS staging is live; a production launch is not done.
- Payment is not done.
- Payment collection is not enabled by default. The readiness foundation still
  needs final prices, Stripe account/product configuration, webhook registration,
  tax/legal decisions, production testing, and an explicit launch decision.
- Privacy controls are basic v1 only; Supabase auth user deletion and full compliance workflows are not done.
- Usage and cost monitoring is alpha operational data, not billing-grade
  analytics; cost values depend on configured price estimates and provider token
  reporting.
- Mentor histories are separated by persisted Mentor relationship. Deeper
  profile-specific memory remains future work; user-level memory is currently
  shared personal context across the user's mentors.
- Mentor switching clears and locks the previous client thread immediately,
  aborts stale history requests, and remounts by selected mentor slug so a late
  response cannot overwrite another mentor's messages.

## Current Test Checklist

- `npm run lint`
- `npm run build`
- `npm run test:mentor-scope`
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

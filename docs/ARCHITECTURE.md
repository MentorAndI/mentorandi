# MentorAndI Architecture

## App Router Structure

MentorAndI uses the Next.js App Router.

- User-facing routes live under `app/`.
- API route handlers live under `app/api/`.
- Reusable UI lives under `components/`.
- Business logic lives under `services/`.
- Prisma schema and seed utilities live under `prisma/`.
- Project documentation lives under `docs/`.

Route handlers should stay thin. They validate requests, resolve users where needed, call services and return HTTP responses.

## API Routes

API routes expose the application boundary for conversations, messages, memories, mentor sessions, alpha feedback and Mentor Core test endpoints.

They should not contain database logic. They should not bypass user ownership checks. Production routes must resolve the current user through the user service.

## Services

Services own business logic.

Current service areas include:

- User resolution.
- Conversations.
- Messages.
- Memories.
- Goals.
- Reflections.
- Mentor sessions.
- Mentor Core modules.
- Mentor Method Library.
- Mentor Expertise Library.
- Active Mentor Catalog.
- Mentor Source Library.
- Usage limits.
- Alpha feedback.
- LLM provider orchestration.

## Repositories

Repositories are Prisma-only. They should not contain product behavior, authorization policy or UI assumptions.

## Database Access And RLS

Supabase Postgres is not a public table API for MentorAndI application data. Direct browser access to public application tables must remain blocked; data access goes through server-side Prisma repositories, service-layer ownership checks and API routes.

RLS must stay enabled on all public app tables: `User`, `Mentor`, `Conversation`, `Message`, `Memory`, `Goal`, `Reflection`, `JournalEntry`, `Feedback` and `UsageEvent`. The hardening script at `prisma/security/rls-hardening.sql` enables RLS, revokes direct `anon`/`authenticated` table grants and verifies no unrestricted public policies exist. Do not add permissive Supabase policies for app data without a separate security review.

## Alpha Feedback

The feedback entry point checks `/api/me` before appearing, so it is visible only with a real Supabase session. `POST /api/feedback` independently resolves the authenticated user without a development fallback, validates the rating, category, message and optional page path, then calls the Feedback service and Prisma-only repository. The API does not expose feedback IDs or provide a cross-user read endpoint.

Feedback belongs to a user and is deleted when that user is deleted. Allowlisted
authenticated admins can inspect aggregate alpha activity at `/admin` and the
100 most recent submissions at `/admin/feedback`. Both server-rendered pages
check the Supabase session email against `ALPHA_ADMIN_EMAILS` before their
services read cross-user data through Prisma. There is no public admin or
feedback read API and no browser-facing Supabase access. See
`docs/ALPHA_ADMIN.md`.

## Alpha Invite Gate

`/signup` sends account-creation requests to the server-only
`/api/auth/signup` boundary. When `ALPHA_INVITE_CODE` is configured, the auth
service validates the submitted code before calling Supabase Auth. The
configured value is never sent to the browser. If the variable is absent or
empty, signup remains open as before. Login, existing accounts and the email
confirmation callback are unchanged. See `docs/ALPHA_INVITE_GATE.md`.

## Alpha Trust Pages

`/alpha`, `/demo`, `/privacy`, `/terms` and `/contact` are public informational pages.
They use simple alpha wording and do not create database records or expose an
API. `/alpha` explains the invited tester flow, safe test scope, feedback path
and bug-report format without linking to internal admin pages. See
`docs/ALPHA_TESTER_GUIDE.md`.
`/contact` provides the alpha support email, directs authenticated users to the
in-product feedback button and explains what to include in a bug report. It
does not provide a public contact form. These pages are not a substitute for
final legal review. See `docs/ALPHA_LEGAL_AND_CONTACT.md`.

`/demo` is the investor-facing product walkthrough. Its five fixed scenarios
link to the normal `/mentor` route with a validated mentor slug. Demo prompt
text is displayed on the card and is not passed through the URL. Authentication,
mentor session loading, ownership enforcement, usage limits, and mentor-scoped
conversation history remain on the existing product path. The page has no
admin links, fake users, or fake metrics. See `docs/INVESTOR_DEMO.md`.

## Mentor Core Flow

The intended flow is:

1. User message is received.
2. User ownership is verified.
3. USER message is stored.
4. Memory, goal and reflection extraction runs as needed.
5. Mentor context is built.
6. Prompt package is composed.
7. Provider response is generated through the LLM adapter.
8. MENTOR message is stored.
9. Structured response is returned to the UI.

## Data Scope

User-level data:

- Memories.
- Goals.
- Reflections.

Conversation-level data:

- Conversations.
- Messages.

User-level data can inform future conversations. Conversation-level data should remain scoped to the selected conversation.

User memory is personal to one user. It captures that user's understandings, goals, reflections and conversation history, and it must not become shared product knowledge.

The Mentor Method Library is reusable product knowledge. Each active mentor has
four concise, curated techniques. The persisted conversation's validated mentor
record selects the eligible library before the current message and lower-weight
recent mentor-scoped context rank its methods. At most two methods enter context,
and the prompt may adapt at most one as the primary intervention so responses do
not become framework-heavy or list-like. See `docs/MENTOR_METHOD_LIBRARIES.md`.

MentorAndI uses one core engine with specialized mentor profiles. The Active
Mentor Catalog defines the slug, positioning, tone, boundaries, opening style,
and persona instructions for Life, ADHD, Relationship, Stress / Burnout,
Parenting, Health & Fitness, Focus, and Confidence. An explicit selection from
`/mentors` is validated at the server boundary and makes that profile's prompt
and expertise primary. Each specialist maps to an active `Mentor` record, and
each `Conversation` keeps its existing `mentorId` relation. Session services
load or create a conversation for the authenticated user and selected mentor;
response services verify both user ownership and mentor match before accepting
a message. Changing a URL parameter cannot attach another profile to an
existing conversation. Legacy `marcus` conversations map to Life and are not
rewritten.

The recent-conversation view can summarize conversations across mentors, but
message history is loaded only for the selected owned conversation. User-level
memory, goals, and reflections remain shared personal context; conversation
messages remain mentor-scoped. Future versions can add deeper mentor-specific
memory strategies. Business and Career are not active alpha categories;
Education remains an undecided future candidate. See
`docs/ALPHA_MENTOR_LINEUP.md`.

On a mentor URL change, the conversation client is keyed by mentor slug. It
clears and disables the previous thread before loading, aborts the previous
history request, and commits a history response only while that request still
belongs to the active mentor load. This prevents out-of-order browser responses
from visually mixing otherwise correctly scoped database conversations.

The Mentor Source Library contains curated knowledge cards and URLs for trusted frameworks or educational resources. It is not live browsing, scraping or web research. Source cards are matched into context only when relevant, and the prompt tells the model not to cite URLs unless the user asks for sources.

Reusable knowledge improves mentor quality, but it is budgeted to control prompt size and cost. `MENTOR_METHODS_LIMIT`, `MENTOR_EXPERTISE_LIMIT` and `MENTOR_SOURCES_LIMIT` control how many matched methods, expertise profiles and source cards can enter context. Not all matched knowledge is sent to the LLM, and the current user message remains the highest-priority context.

Future aggregate learning may suggest improvements to the method, expertise and source libraries, but shared knowledge should remain curated and admin-approved. Personal user data should not be stored or reused as cross-user knowledge.

Aggregate Learning Suggestions v1 is a design foundation only. The service interface describes future privacy-preserving suggestion inputs and admin-reviewed outputs, but it does not read cross-user data, store suggestions or change Mentor Core behavior. Any future aggregate signal must already be stripped of raw messages, user identifiers, conversation identifiers and personal memories before it can be considered for a curated shared knowledge update.

Mentor tone is calibrated in the prompt composer. Marcus is positioned as a
personal Life Mentor who should challenge with tact: direct but not accusatory,
warmly affirming without empty praise, practical without productivity-coach
cliches, emotionally present without pretending to be a clinician or human,
and observant without sounding clinical. Repeated user goals or concerns should
be treated as signal to make the topic more concrete, not as a failure to
answer correctly. Personal mentoring responses default to conversational prose:
respond to the specific situation, vary validation, recognize one evidenced
strength such as honesty, awareness, effort, courage or willingness, name at
most one tentative pattern, offer one concrete next step and end personal
mentoring responses with exactly one useful question. See
`docs/MARCUS_RESPONSE_QUALITY.md`.

## LLM Provider Abstraction

Mentor Core does not call provider APIs directly.

The LLM adapter chooses a provider behind a shared interface. The mock provider is only for deterministic development testing. OpenAI and Anthropic/Claude provider modes use the structured Mentor Core prompt contract for real model responses once configuration and billing are ready.

Model routing is both cost-control and quality-control. Normal daily chat, direct factual questions, simple productivity questions and lightweight ADHD technique requests should use the configured cheap/default route. Higher-value mentor moments such as emotionally complex reflection, repeated stuck patterns, identity or life-direction questions, difficult relationship or personal decisions and complex overthinking loops should use the configured deep route.

The routed configuration can choose a provider and model per route with `LLM_CHEAP_PROVIDER`/`LLM_CHEAP_MODEL`, `LLM_DEFAULT_PROVIDER`/`LLM_DEFAULT_MODEL` and `LLM_DEEP_PROVIDER`/`LLM_DEEP_MODEL`. `LLM_PROVIDER` remains supported as the simple fallback/default provider when route-specific provider configuration is missing.

## Usage Limits

Persistent usage monitoring stores safe operational metadata for successful,
failed, and blocked mentor requests. `/api/mentor/respond` and
`/api/mentor-core/respond` resolve a real authenticated user first, query
successful events for UTC daily, weekly, monthly, and deep-weekly windows, then
record provider/model/route, token counts, estimated cost, status, and a safe
error code when available. Message content is not duplicated into usage events.

Production enforces alpha defaults with `ALPHA_DAILY_MESSAGE_LIMIT`,
`ALPHA_WEEKLY_MESSAGE_LIMIT`, `ALPHA_MONTHLY_MESSAGE_LIMIT` and
`ALPHA_WEEKLY_DEEP_LIMIT`. A persistent tracking failure returns a safe error
instead of bypassing limits. Local development can use the legacy process-local
fallback. `/admin/usage` exposes aggregates and recent metadata only to
allowlisted admins. Cost data is estimated and not billing-grade. See
`docs/ALPHA_USAGE_MONITORING.md`.

## Mentor Evaluation

`npm run eval:mentor` runs the full Mentor Core flow through the development test API. It requires a running app server, connected database and seeded development user, then evaluates routing, context building, prompt composition, provider behavior and reusable knowledge matching together. Reports are written to `reports/mentor-eval-latest.json`.

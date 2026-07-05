# MentorAndI Project Status

## Product Name

MentorAndI

## Current Status

- Local alpha.
- Next.js app running locally.
- Supabase, PostgreSQL and Prisma are connected.
- Mentor Core foundation is working with centralized LLM provider selection.
- Aggregate Learning Suggestions v1 exists as a disabled design/service-interface foundation only; no cross-user learning is implemented.
- Mock mode is available for deterministic local testing.
- OpenAI and Claude provider modes are the intended paths for real mentor response quality.

## Current User Flows

- `/start` first conversation experience.
- `/mentor` main mentor experience.
- `/dev/mentor-test` development test page.

## Core Systems Built

- Supabase Auth foundation.
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

## Alpha Auth Behavior

- `/login`, `/signup` and `/forgot-password` are public auth pages.
- Successful login redirects to `/mentor`.
- Successful signup redirects to `/start`.
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

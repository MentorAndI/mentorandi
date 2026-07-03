# MentorAndI Project Status

## Product Name

MentorAndI

## Current Status

- Local alpha.
- Next.js app running locally.
- Supabase, PostgreSQL and Prisma are connected.
- Mentor Core foundation is working with a mock provider for local testing.

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
- Context Builder.
- Prompt Composer.
- Response Pipeline.
- LLM provider adapter.
- Mock provider.
- OpenAI provider foundation.

## Important Behavior Rules

- Current user message has priority.
- Recent context only dominates when the current message is a clear follow-up.
- Memories are user-level.
- Goals are user-level.
- Reflections are user-level.
- Conversations are user-scoped.
- Development fallback user is allowed only outside production.
- Raw IDs are not exposed in user-facing UI.

## Known Limitations

- OpenAI provider exists, but billing/quota is not working yet.
- Mock provider is currently primary for local testing.
- Memory, goal and reflection extraction is rule-based.
- UI is functional but not final design.
- Deployment is not done.
- Payment is not done.
- Privacy, data export and account deletion controls are not done.

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

# MentorAndI Agent Guardrails

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Name

MentorAndI

## Product Definition

MentorAndI is a long-term AI mentor product.

It is not a generic chatbot. It is built around memory, goals, reflections and an ongoing mentor relationship.

## Development Rules

- For backlog-driven prompts, read `docs/CODEX_TASKS.md` after `AGENTS.md`, `docs/PROJECT_STATUS.md` and `docs/ARCHITECTURE.md`.
- Short prompts like `Implement Feature 086 from docs/CODEX_TASKS.md` are valid; implement only the named feature and obey its rules.
- Do not change the Prisma schema unless explicitly asked.
- Do not add packages unless explicitly asked.
- Do not expose raw database IDs in user-facing UI.
- Keep API routes thin.
- Keep repositories Prisma-only.
- Put business logic in services.
- Keep Mentor Core separate from UI.
- Do not remove dev routes.
- Do not break `/start`, `/mentor` or `/dev/mentor-test`.
- Current user message has priority over stale context.
- User ownership must be enforced for conversations, messages, memories, goals and reflections.
- Development fallback user is allowed only outside production.

## Core Architecture

- User resolution.
- Conversation service.
- Message service.
- Memory service.
- Goal service.
- Reflection service.
- Context Builder.
- Prompt Composer.
- Response Pipeline.
- LLM providers.
- Mock provider for deterministic development testing.
- OpenAI provider mode.
- Anthropic/Claude provider mode.

## Required Verification After Code Changes

- `npm run check:env`
- `npm run lint`
- `npm run build`
- Manual check `/start`
- Manual check `/mentor`
- Manual check `/dev/mentor-test`

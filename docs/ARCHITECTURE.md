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

API routes expose the application boundary for conversations, messages, memories, mentor sessions and Mentor Core test endpoints.

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
- LLM provider orchestration.

## Repositories

Repositories are Prisma-only. They should not contain product behavior, authorization policy or UI assumptions.

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

The Mentor Method Library is reusable product knowledge. It contains concise, curated mentor techniques that can be matched into context when the current user message and recent conversation make them relevant. The context builder includes only a small number of relevant methods, not the whole library.

Future aggregate learning may suggest improvements to the method library, but shared methods should remain curated and admin-approved. Personal user data should not be stored or reused as cross-user knowledge.

## LLM Provider Abstraction

Mentor Core does not call provider APIs directly.

The LLM adapter chooses a provider behind a shared interface. The mock provider is only for deterministic development testing. OpenAI and Anthropic/Claude provider modes use the structured Mentor Core prompt contract for real model responses once configuration and billing are ready.

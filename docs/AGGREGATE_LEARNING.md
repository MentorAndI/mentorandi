# Aggregate Learning Suggestions

Aggregate Learning Suggestions are a future design path for noticing repeated product-level mentor needs across users without turning personal user memory into shared knowledge.

## Current Status

Feature 086 is a foundation only:

- No Prisma schema changes.
- No database storage.
- No cross-user learning implementation.
- No automatic promotion of personal memories, goals, reflections or messages into shared knowledge.
- No changes to Mentor Core runtime behavior.

The current service module is intentionally disabled. It defines the shape of future aggregate suggestion inputs and outputs, but it does not read user data or create real suggestions.

## Boundary

Personal user data remains personal:

- Memories are user-level.
- Goals are user-level.
- Reflections are user-level.
- Conversations and messages are conversation-scoped and user-owned.

Reusable product knowledge remains curated:

- Mentor Method Library techniques are curated/admin-approved.
- Mentor Expertise Library profiles are curated/admin-approved.
- Mentor Source Library cards are curated/admin-approved.

Future aggregate learning may only suggest improvements to those reusable libraries after privacy-preserving review. Shared knowledge must remain curated and admin-approved.

## Future Input Contract

Future aggregate suggestion inputs must already be privacy-preserving. They may include:

- Theme labels.
- Domain tags.
- Occurrence counts.
- Confidence levels.
- Short non-personal summaries.

They must not include:

- Raw user messages.
- Personal memories.
- Personal goals or reflections.
- User identifiers.
- Conversation identifiers.
- Any data that can reasonably identify one user.

## Review Model

Aggregate suggestions should be draft recommendations only. An admin or curator must review and approve any change before it becomes reusable product knowledge.

The intended review questions are:

- Is the suggestion useful across users?
- Is it free of personal user data?
- Does it belong in methods, expertise, source notes, tone guidance or documentation?
- Is there a trusted source or product rationale?
- Does it preserve MentorAndI's mentor tone and safety boundaries?

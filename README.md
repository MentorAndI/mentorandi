# MentorAndI

MentorAndI is a long-term AI mentor product built around memory, goals, reflections and an ongoing mentor relationship.

It is not a generic chatbot.

## Current Status

The project is in local alpha. The Next.js app runs locally with Supabase, PostgreSQL and Prisma connected. Mentor Core is functional with mock mode for deterministic testing and real provider modes for OpenAI and Anthropic/Claude.

## Key Routes

- `/start` — first conversation experience.
- `/mentor` — main mentor experience.
- `/dev/mentor-test` — development pipeline test page.

## Development

```bash
npm run dev
```

## Verification

Run these after code changes:

```bash
npm run lint
npm run build
```

Also manually check `/start`, `/mentor` and `/dev/mentor-test` when behavior changes.

## Documentation

- [Engineering Guide](docs/ENGINEERING_GUIDE.md)
- [Project Status](docs/PROJECT_STATUS.md)
- [Next Steps](docs/NEXT_STEPS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Backup And Recovery](docs/BACKUP_AND_RECOVERY.md)
- [Agent Guardrails](AGENTS.md)

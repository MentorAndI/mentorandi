# Full Mentor Evaluation Runner

`npm run eval:mentor` evaluates the full Mentor Core flow through the development API, not just raw provider connectivity.

## Requirements

- Local app server running with `npm run dev`.
- Database connected through `DATABASE_URL`.
- Development seed data available through `npm run db:seed`.
- `/api/dev/seed-data` and `/api/dev/test-mentor-response` available outside production.
- Model routing configured, or `LLM_PROVIDER=mock` for deterministic local testing.
- Mentor Method, Expertise and Source libraries available in the context builder.

## What It Tests

The runner sends multi-scenario messages through `/api/dev/test-mentor-response`, so it exercises:

- User and mentor seed lookup.
- Conversation creation and follow-up context.
- Message storage.
- Goal, memory and reflection extraction.
- Context Builder.
- Prompt Composer.
- Model routing.
- LLM provider adapter.
- Mentor Method, Expertise and Source matching diagnostics.

By default the runner omits an explicit provider so automatic model routing can choose the configured route. Set `EVAL_MENTOR_PROVIDERS=mock,openai,anthropic` to add explicit provider cases.

## Output

The runner prints a readable result for each scenario and writes:

```bash
reports/mentor-eval-latest.json
```

Generated JSON reports are ignored by git.

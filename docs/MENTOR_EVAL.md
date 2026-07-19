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
- Response-quality diagnostics for word count, list-heavy formatting,
  follow-up question count, warm affirmation and generic assistant phrases.

The personal mentoring scenarios cover Focus, ADHD-like task initiation,
overthinking, relationship conflict, stress/burnout, self-doubt and life
direction. The Focus, ADHD, relationship, stress and self-doubt scenarios also
expect a recognizable warm affirmation. Personal scenarios expect
conversational prose with exactly one follow-up question and reject configured
stock assistant phrases. These checks are simple diagnostics, not a substitute
for human review of specificity, emotional fit, pattern recognition and
usefulness.

By default the runner omits an explicit provider so automatic model routing can choose the configured route. Set `EVAL_MENTOR_PROVIDERS=mock,openai,anthropic` to add explicit provider cases.

## Output

The runner prints a readable result for each scenario and writes:

```bash
reports/mentor-eval-latest.json
```

Generated JSON reports are ignored by git.

Review `responseText` and `responseQuality` in the report. A strong Marcus
response should:

- reflect the user's specific situation before advice;
- include a short, grounded affirmation when appropriate;
- name no more than one tentative emotional or behavioral pattern;
- offer one concrete next step;
- end with one useful question;
- avoid generic advice lists and productivity-blog language.

The question-count check includes questions inside quoted scripts and exercises.
Those should be rewritten as statements so the final follow-up remains the only
question in the response.

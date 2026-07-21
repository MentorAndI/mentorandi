# Usage Limits

Mentor And I enforces alpha request limits from persistent server-side
`UsageEvent` records. Successful mentor responses count toward limits; failure
and blocked events remain available for operational review without consuming a
successful-message allowance.

## Configuration

```bash
USAGE_LIMITS_ENABLED=
ALPHA_DAILY_MESSAGE_LIMIT=25
ALPHA_WEEKLY_MESSAGE_LIMIT=100
ALPHA_MONTHLY_MESSAGE_LIMIT=300
ALPHA_WEEKLY_DEEP_LIMIT=5
```

- `USAGE_LIMITS_ENABLED=true` enforces limits in any environment.
- `USAGE_LIMITS_ENABLED=false` disables enforcement in any environment.
- If it is empty, enforcement defaults on only for `NODE_ENV=production`.
- Empty or invalid limit values use the safe defaults above.

The daily window starts at 00:00 UTC, the weekly window is the ISO week starting
Monday UTC, and the monthly window starts on the first day of the UTC month.
Deep-route successful events also have a separate ISO-week count.

## Enforcement and failure behavior

`/api/mentor/respond` and `/api/mentor-core/respond` query the authenticated
application user's persistent successful usage before the LLM pipeline runs.
Exceeded limits return a clear 429 alpha message and create a blocked event.
Successful calls store provider, model, route, token counts, and an estimated
cost when pricing and token data are available. Safe failure codes are recorded
without prompts, responses, secrets, or stack traces.

Production and staging fail closed with a safe 503 when persistent usage cannot
be read or written. Local development falls back to the legacy process-local
counters when its database is unavailable, so local work is not blocked.

The v1 persistent flow survives process restarts and supports alpha operations.
It is not a billing-grade, high-concurrency reservation ledger. Cost figures are
configured estimates, not invoices. See `docs/ALPHA_USAGE_MONITORING.md`.

# Usage Limits

Usage Limits v1 provides basic request-count guardrails before alpha.

## Current Status

Feature 094 enforces alpha limits on top of the in-memory foundation:

- No Prisma schema changes.
- No database dependency.
- No packages.
- Mentor response requests are checked before the LLM pipeline runs.
- Successful mentor responses are recorded after the pipeline succeeds.
- Failed requests and public page views are not counted.
- Counters are scoped by authenticated Supabase user ID, not fallback users.

Counts are process-local. They reset when the server process restarts and are not shared across multiple running instances.

## Configuration

```bash
USAGE_LIMITS_ENABLED=
ALPHA_DAILY_MESSAGE_LIMIT=25
ALPHA_WEEKLY_MESSAGE_LIMIT=100
ALPHA_MONTHLY_MESSAGE_LIMIT=300
ALPHA_WEEKLY_DEEP_LIMIT=5
```

Behavior:

- `USAGE_LIMITS_ENABLED=true` enforces limits in any environment.
- `USAGE_LIMITS_ENABLED=false` disables enforcement in any environment.
- If `USAGE_LIMITS_ENABLED` is empty, enforcement is enabled only when `NODE_ENV=production`.
- Empty or invalid alpha limit values use the safe defaults shown above.
- Local development records counts but does not block requests unless enforcement is explicitly enabled.

Limits:

- Mentor messages: 25 daily, 100 weekly, 300 monthly by default.
- Deep/Claude mentor calls: 5 weekly by default.
- Deep calls that exceed the weekly limit are blocked server-side with a clear alpha usage message.

## Current Scope

Usage limits are checked for:

- `/api/mentor/respond`
- `/api/mentor-core/respond`

The limiter uses the authenticated Supabase user ID internally as the counter key, but raw IDs are not returned to the UI.

## Future Persistence

Later versions should persist usage to the database so limits survive restarts and work across multiple app instances. That future implementation will need a Prisma schema change and migration, so it is intentionally out of scope for v1.

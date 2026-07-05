# Usage Limits

Usage Limits v1 provides basic request-count guardrails before alpha.

## Current Status

Feature 087 is an in-memory foundation:

- No Prisma schema changes.
- No database dependency.
- No packages.
- No local development blocking by default.
- Mentor response requests are checked before the LLM pipeline runs.

Counts are process-local. They reset when the server process restarts and are not shared across multiple running instances.

## Configuration

```bash
USAGE_LIMITS_ENABLED=
MENTOR_DAILY_REQUEST_LIMIT=
MENTOR_MONTHLY_REQUEST_LIMIT=
```

Behavior:

- `USAGE_LIMITS_ENABLED=true` enforces limits in any environment.
- `USAGE_LIMITS_ENABLED=false` disables enforcement in any environment.
- If `USAGE_LIMITS_ENABLED` is empty, enforcement is enabled only when `NODE_ENV=production`.
- Empty or invalid request limits are treated as unlimited.
- Local development records counts but does not block requests unless enforcement is explicitly enabled.

## Current Scope

Usage limits are checked for:

- `/api/mentor/respond`
- `/api/mentor-core/respond`

The limiter uses the resolved user ID internally as the counter key, but raw IDs are not returned to the UI.

## Future Persistence

Later versions should persist usage to the database so limits survive restarts and work across multiple app instances. That future implementation will need a Prisma schema change and migration, so it is intentionally out of scope for v1.

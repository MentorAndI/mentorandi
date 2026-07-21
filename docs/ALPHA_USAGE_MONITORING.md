# Alpha Usage And Cost Monitoring

MentorAndI stores one server-side `UsageEvent` for successful, failed, and
limit-blocked mentor requests. Usage events contain operational metadata only:
user, optional mentor and conversation relationships, provider, model, route,
token counts, estimated cost, safe error code, status, and creation time. They
do not store the user's message or mentor response content.

## Persistent limits

Before a mentor response, the usage service queries successful events for that
user in the current UTC day, ISO week, and calendar month. Deep-route usage is
queried separately for the current UTC ISO week. The existing environment
limits remain authoritative:

- `ALPHA_DAILY_MESSAGE_LIMIT`
- `ALPHA_WEEKLY_MESSAGE_LIMIT`
- `ALPHA_MONTHLY_MESSAGE_LIMIT`
- `ALPHA_WEEKLY_DEEP_LIMIT`

Production and staging fail closed when persistent usage state cannot be read
or written. The API returns a safe temporary-unavailability response and does
not silently bypass configured limits. Local development can fall back to the
existing process-local counters so an unavailable development database does not
block local work.

Successful responses count toward limits. Failed and blocked events remain
queryable for operations but do not consume a successful-message allowance.
The v1 count-then-record flow is durable across restarts, but it is not a
billing-grade reservation ledger for highly concurrent traffic.

## Cost estimates

Successful usage events store provider token counts when supplied and an
estimated USD cost when `LLM_INPUT_COST_PER_1M` and
`LLM_OUTPUT_COST_PER_1M` are configured. Prices are operational configuration,
not hardcoded product claims. Missing token or pricing data produces no cost
value rather than an invented number.

These figures are directional alpha estimates. They are not invoices,
provider reconciliation, or billing-grade analytics.

## Internal admin view

`/admin/usage` is server-rendered and protected by the existing Supabase session
and `ALPHA_ADMIN_EMAILS` allowlist. It shows:

- successful messages and estimated cost today, over 7 days, and over 30 days;
- average provider-reported input and output tokens over 24 hours and 7 days;
- usage by provider, model, and mentor over 30 days;
- the all-time blocked-request count;
- the 50 most recent usage events without message content.

The page is linked only from internal admin navigation. There is no public usage
API and no direct browser access to the usage table.

The token averages make prompt regressions visible without exposing message
content. They use successful events with provider token data; a zero indicates
that no usable token measurements exist for that period.

## Deployment and security

Migration `20260721170000_add_usage_events` creates the table, indexes, foreign
keys, RLS, and browser-role revocations. Automatic and manual staging deploys
run `prisma migrate deploy` in a dedicated one-shot Compose service before the
application image is started. A migration failure stops deployment.

`prisma/security/rls-hardening.sql` includes `UsageEvent` in its persistent RLS,
grant, and unrestricted-policy verification.

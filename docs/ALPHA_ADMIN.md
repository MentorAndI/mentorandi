# Alpha Admin

Mentor And I has four internal alpha admin pages:

- `/admin` shows aggregate user, conversation, message and feedback totals,
  recent users and conversations, and a feedback summary.
- `/admin/feedback` shows the 100 most recent feedback submissions.
- `/admin/usage` shows persistent message counts, estimated costs,
  provider/model/mentor breakdowns, blocked attempts, and recent usage events.
- `/admin/invites` creates one-time-display invite codes, lists safe invite
  metadata and status, and revokes active invites. Raw codes are never listed.

All routes require a real Supabase-authenticated user whose normalized email is
included in the comma-separated `ALPHA_ADMIN_EMAILS` environment variable:

```env
ALPHA_ADMIN_EMAILS=rene@example.com,admin@example.com
```

Authorization runs on the server before any cross-user data is read. An
unauthenticated request redirects to login, and an authenticated account outside
the allowlist receives a 403-style page. There are no public admin APIs or
homepage links.

Admin reads go through Prisma. User emails are joined server-side from Supabase
Auth and are never exposed through a public endpoint. No permissive RLS policy
is required.

Invite create/revoke APIs apply the same server-side allowlist before mutation.
There is no public invite-list API, and `AlphaInvite` is inaccessible to browser
database roles.

Usage monitoring is now database-backed for production/staging. The usage page
does not show message content or secrets. Cost values depend on configured token
prices and provider-reported token counts, so they are estimates rather than
billing-grade analytics. Local development can still use process-local counters
when its database is unavailable.

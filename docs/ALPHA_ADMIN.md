# Alpha Admin

MentorAndI has two internal, server-rendered alpha admin pages:

- `/admin` shows aggregate user, conversation, message and feedback totals;
  recent users and conversations; a feedback summary; and process-local
  usage-limit counters when available.
- `/admin/feedback` shows the 100 most recent feedback submissions.

Both routes require a real Supabase-authenticated user whose normalized email is
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

Usage-limit counters are process-local alpha diagnostics. They reset on restart
and are not shared between app instances, so they are not durable analytics.

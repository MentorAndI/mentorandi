# Database Security

Mentor And I uses Supabase Postgres as the database, but application data access must stay behind server-side Prisma repositories and API routes.

## Public Table Access

Direct public Supabase table access must remain blocked for all application tables:

- `User`
- `Mentor`
- `Conversation`
- `Message`
- `Memory`
- `Goal`
- `Reflection`
- `JournalEntry`
- `Feedback`
- `UsageEvent`
- `AlphaInvite`

Do not add permissive `anon` or `authenticated` policies for these tables. Browser clients should not read or write Mentor And I application tables through Supabase directly.

## RLS Hardening

Use `prisma/security/rls-hardening.sql` as the persistent hardening script. It:

- enables RLS on all public application tables
- revokes direct table grants from `anon` and `authenticated`
- fails if any app table does not have RLS enabled
- fails if a permissive unrestricted `anon`, `authenticated` or `public` policy exists

The script intentionally does not create policies. If a future feature needs database-level policies, they must be reviewed as a separate security change and must not bypass server-side ownership checks.

`UsageEvent` is operational metadata and is server-side only. It stores no
message or response content. The usage migration enables RLS and revokes direct
`anon` and `authenticated` grants immediately, while the persistent hardening
script verifies that protection alongside the other application tables.

`AlphaInvite` is server-only access-control metadata. It stores a SHA-256 code
hash and short preview, never the generated raw code. Its migration immediately
enables RLS and revokes direct `anon` and `authenticated` grants; admin and
signup operations go through protected server routes and Prisma services.

## Access Model

Application data access goes through:

- server-side Prisma repositories
- service-layer ownership checks
- API routes that resolve the authenticated user

RLS must stay enabled on all public app tables even when server-side Prisma uses a privileged database connection.

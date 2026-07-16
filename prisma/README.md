# Prisma

Prisma schema and database-related files belong here.

Security hardening scripts live under `prisma/security/`. The RLS hardening script is intentionally separate from Prisma schema changes and does not add permissive Supabase policies.

## Inspecting alpha feedback

Authenticated admins listed in `ALPHA_ADMIN_EMAILS` can inspect the 100 most
recent submissions at `/admin/feedback`. This is a server-rendered Prisma read;
there is no public readback API or permissive Supabase policy.

Database administrators can also use a read-only query:

```sql
select "createdAt", rating, category, message, "pagePath"
from "Feedback"
order by "createdAt" desc
limit 100;
```

Apply `prisma/security/rls-hardening.sql` after migrations in environments where the database owner or migration tooling may have changed grants.

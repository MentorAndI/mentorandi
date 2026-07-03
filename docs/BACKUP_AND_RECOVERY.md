# Backup And Recovery

## Source Of Truth

GitHub is the source of truth for code.

Commit and sync after each working feature. Keep commits small enough that a broken change can be understood and reverted safely.

## Secrets

Never commit `.env` secrets.

Use `.env.example` only for variable names. Keep real API keys, database URLs and Supabase secrets in a password manager or deployment secret manager.

## Database Safety

Keep the Supabase database backed up before risky migrations.

Prisma migrations must be committed. Do not run destructive schema changes without first exporting Supabase data.

Before destructive database work:

- Export Supabase data.
- Confirm the migration plan.
- Confirm recovery steps.
- Commit the migration files.

## Secondary Backups

Google Drive may be used only as a secondary backup for exported docs or database snapshots.

Google Drive is not the source of truth for the codebase.

## Recovery Priorities

1. Restore the codebase from GitHub.
2. Restore environment variables from the secret manager.
3. Restore Supabase/Postgres from the latest safe backup.
4. Run Prisma migration status checks before applying new migrations.
5. Verify `/start`, `/mentor` and `/dev/mentor-test`.

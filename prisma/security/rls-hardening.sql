-- MentorAndI Supabase RLS hardening.
--
-- Purpose:
-- - Enable Row Level Security on all public application tables and Prisma's migration metadata table.
-- - Revoke direct browser-facing role grants from those tables.
-- - Verify no unrestricted anon/authenticated policies allow table access.
--
-- This script intentionally does not create permissive policies.
-- Application data access must go through server-side Prisma/API routes.

begin;

do $$
declare
  app_table text;
  app_tables text[] := array[
    'User',
    'Mentor',
    'Conversation',
    'Message',
    'Memory',
    'Goal',
    'Reflection',
    'JournalEntry',
    'Feedback',
    'UsageEvent',
    'AlphaInvite',
    'Subscription',
    'MentorSpecialistPack',
    'MentorTechnique',
    'MentorKnowledgeCard',
    'MentorSource',
    'MentorSafetyRule',
    'MentorEvalScenario',
    '_prisma_migrations'
  ];
begin
  foreach app_table in array app_tables loop
    execute format('alter table public.%I enable row level security', app_table);
    execute format('revoke all on table public.%I from anon', app_table);
    execute format('revoke all on table public.%I from authenticated', app_table);
  end loop;
end $$;

do $$
declare
  disabled_tables text;
  unrestricted_policies text;
begin
  select string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by c.relname)
    into disabled_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in (
      'User',
      'Mentor',
      'Conversation',
      'Message',
      'Memory',
      'Goal',
      'Reflection',
      'JournalEntry',
      'Feedback',
      'UsageEvent',
      'AlphaInvite',
      'Subscription',
      'MentorSpecialistPack',
      'MentorTechnique',
      'MentorKnowledgeCard',
      'MentorSource',
      'MentorSafetyRule',
      'MentorEvalScenario',
      '_prisma_migrations'
    )
    and not c.relrowsecurity;

  if disabled_tables is not null then
    raise exception 'RLS is not enabled on protected tables: %', disabled_tables;
  end if;

  with app_tables(table_name) as (
    values
      ('User'),
      ('Mentor'),
      ('Conversation'),
      ('Message'),
      ('Memory'),
      ('Goal'),
      ('Reflection'),
      ('JournalEntry'),
      ('Feedback'),
      ('UsageEvent'),
      ('AlphaInvite'),
      ('Subscription'),
      ('MentorSpecialistPack'),
      ('MentorTechnique'),
      ('MentorKnowledgeCard'),
      ('MentorSource'),
      ('MentorSafetyRule'),
      ('MentorEvalScenario'),
      ('_prisma_migrations')
  ),
  risky_policies as (
    select
      format('%I.%I policy %I', schemaname, tablename, policyname) as policy_label
    from pg_policies p
    join app_tables t on t.table_name = p.tablename
    where p.schemaname = 'public'
      and p.permissive = 'PERMISSIVE'
      and (
        'public' = any(p.roles)
        or 'anon' = any(p.roles)
        or 'authenticated' = any(p.roles)
      )
      and (
        (p.cmd in ('SELECT', 'UPDATE', 'DELETE', 'ALL') and coalesce(nullif(trim(p.qual), ''), 'true') = 'true')
        or (p.cmd in ('INSERT', 'UPDATE', 'ALL') and coalesce(nullif(trim(p.with_check), ''), 'true') = 'true')
      )
  ),
  risky_grants as (
    select
      format('%I.%I direct %s grant to %s', table_schema, table_name, privilege_type, grantee) as grant_label
    from information_schema.table_privileges
    join app_tables using (table_name)
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  )
  select string_agg(label, ', ' order by label)
    into unrestricted_policies
  from (
    select policy_label as label from risky_policies
    union all
    select grant_label as label from risky_grants
  ) findings;

  if unrestricted_policies is not null then
    raise exception 'Unrestricted public table access detected: %', unrestricted_policies;
  end if;
end $$;

commit;

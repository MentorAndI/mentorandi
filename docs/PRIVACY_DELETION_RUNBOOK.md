# Privacy Deletion Runbook

Purpose: operational procedure for a verified request to delete a Mentor And I account and associated personal/consumer-health data. This is an internal procedure, not a substitute for legal review.

## Principles

- Verify the requester before deleting or disclosing data.
- Stop new service activity before destructive deletion.
- Do not leave an active Stripe subscription attached to an account that is being removed.
- Delete mentoring/consumer-health data from active application storage promptly once the request is approved.
- Retain only records that have a documented legal, accounting, fraud-prevention or dispute-resolution reason.
- Record the deletion operation without copying deleted conversation content into the audit record.
- If a backup is restored later, re-apply all deletion tombstones/requests that post-date the restore point before returning the restored system to users.

## Systems in scope

1. Mentor And I application database (Supabase Postgres).
2. Supabase Auth.
3. Stripe subscription/customer records.
4. OpenAI API processing records subject to the project's actual retention controls.
5. Anthropic API processing records subject to the organization's actual retention controls.
6. Hostinger application/server logs and any future log drains.
7. Database backups or off-site dumps if/when enabled.

## Request intake

1. Receive request through the authenticated application where available or `support@mentorandi.com`.
2. Record request date, request type and internal case/reference ID. Do not copy unnecessary sensitive conversation text into the ticket.
3. Verify identity using account-controlled communication or authenticated session evidence. Do not use knowledge-based questions derived from mentoring content.
4. Identify the application user ID and Supabase Auth user ID server-side. Do not ask the user to provide internal IDs.
5. Determine whether the request is:
   - mentor-data deletion only;
   - full account deletion;
   - access/export request;
   - correction/restriction/other privacy request.

## Mentor-data deletion only

Use the authenticated `Delete my mentor data` control or equivalent server-side service. Feature 114 deletes:

- messages;
- conversations;
- memories;
- goals;
- reflections;
- journal entries;
- feedback;
- usage events;
- saved mentor selection.

It deliberately preserves authentication, subscription, billing and credit records.

After execution, verify the sensitive-data tables contain no rows for the user and `Subscription.selectedMentorSlug` is null.

## Full account deletion

### 1. Stripe state

If a paid subscription exists:

- cancel service entitlement/subscription according to the applicable user request and billing terms before removing the application's subscription mapping;
- do not create a new charge, refund or credit unless separately required/approved;
- retain Stripe invoices/payment records only to the extent required for accounting, tax, fraud prevention, chargebacks or legal obligations;
- do not retain mentoring conversation content in Stripe metadata.

Document the Stripe action and effective cancellation date in the deletion case.

### 2. Active mentoring data

Run mentor-data deletion first so sensitive content is removed from active application tables before account identifiers are removed.

Verify deletion of messages, conversations, memories, goals, reflections, journal entries, feedback and usage events, plus clearing selected mentor.

### 3. Application database account

After Stripe state is resolved and any legally required billing references are recorded outside sensitive mentoring data, delete the application `User` record. The schema's cascade relations remove remaining user-owned application records such as subscription and credit-account mappings.

Verify no active application row remains for the deleted application user ID in user-owned tables.

### 4. Supabase Auth

Delete the corresponding Supabase Auth user using an authorized administrative method. Verify the user can no longer authenticate.

Do not expose service-role keys or auth tokens in the deletion case/log.

### 5. AI providers

Mentor And I does not create OpenAI Responses application-state records because the integration sets `store: false`; default OpenAI abuse-monitoring retention may nevertheless apply unless the project has approved MAM/ZDR.

Anthropic API inputs/outputs are subject to the organization's configured/default commercial retention terms.

For ordinary requests, record the relevant provider retention window/control and allow provider-side ephemeral records to expire under the contracted policy unless law or the provider's privacy process requires a specific deletion request. Escalate unusual provider deletion requests to the privacy owner.

### 6. Logs

Search only by non-content identifiers that are available and proportionate. Application safety telemetry must not contain message text. Remove or anonymize identifiable log records where required and operationally supported, subject to legitimate security/legal retention.

### 7. Backups

As of 25 August 2026, the production Supabase organization is on the Free plan and should not be assumed to have managed daily restore backups. Before a broader launch, production backup policy must be upgraded or replaced with automated encrypted off-site dumps.

Once backups exist:

- maintain a deletion tombstone register containing only the minimum identifier needed to prevent resurrection after restore;
- after any restore, replay deletion tombstones before reopening service;
- expire tombstones when all backups capable of restoring the deleted data have expired.

## Verification checklist

For a full deletion case, record PASS/FAIL for:

- identity verified;
- subscription/Stripe state resolved;
- mentor-data deletion completed;
- selected mentor cleared;
- application User removed;
- Supabase Auth user removed;
- user can no longer authenticate;
- provider-retention status recorded;
- backup/tombstone requirement handled;
- completion notice sent to requester.

Do not record deleted message content, memory content, health information or passwords in this checklist.

## Restoration rule

No production restore may be declared complete until privacy deletion tombstones newer than the restore point have been replayed and verified. This requirement becomes mandatory as soon as production backups/off-site dumps are enabled.

## Ownership and review

Assign an internal privacy owner before broader public launch. Review this runbook whenever authentication, billing, AI providers, database architecture, backup strategy or privacy policies materially change.

# Consumer Health Data Implementation Audit — 25 August 2026

Status: implementation audit completed for the current Mentor And I application code. This document records actual behavior and remaining operational/legal gates. It is not a claim of regulatory certification.

## Scope

Compared the application schema, mentor response pipeline, account export/deletion controls, billing/usage records, provider integrations and application dependencies against the published Privacy Policy and Consumer Health Data Privacy Policy.

## Data categories actually stored

Potentially sensitive or consumer-health-related information can appear in:

- `Message.content`: user messages and AI mentor responses.
- `Memory.title` / `Memory.content`: product-generated continuity information inferred from conversations.
- `Goal.title` / `Goal.description`: user goals and inferred/structured goal context.
- `Reflection.summary`: product-generated development reflections.
- `JournalEntry.title` / `JournalEntry.content` / `JournalEntry.mood`: user journal information if the journal feature is used.
- `Feedback.message`, `Feedback.mentorSlug` and page context: user feedback that may itself contain sensitive information or reveal mentor choice.
- `Subscription.selectedMentorSlug`: selected specialist mentor; selection can itself reveal sensitive interests (for example ADHD, stress or health).
- `UsageEvent`: mentor/conversation references and specialist-pack metadata plus technical model/token/cost data. Usage events are not intended to duplicate full conversation content, but mentor/specialist metadata can still be sensitive.

The application does not have dedicated diagnosis or medical-record fields. Users can nevertheless voluntarily put health information into free-text fields, so those fields must be treated as potentially sensitive.

## Purposes observed in implementation

The sensitive categories above are used to:

- generate requested mentor responses;
- maintain conversation history and continuity;
- select relevant memories, goals, reflections, techniques and specialist context;
- provide user-visible history and data controls;
- apply access, usage and credit rules;
- operate safety safeguards;
- receive product feedback;
- administer the service and troubleshoot failures.

No implementation path reviewed uses private mentor content for advertising.

## AI model processing

Mentor response generation can route to OpenAI or Anthropic.

OpenAI integration:

- uses the Responses API;
- sends the current user message plus the context needed to generate the response;
- explicitly sends `store: false`;
- OpenAI's API documentation still states that default abuse-monitoring logs can retain customer content for up to 30 days unless an approved Zero Data Retention or Modified Abuse Monitoring control applies. `store: false` prevents application-state storage but is not by itself a Zero Data Retention agreement.

Anthropic integration:

- uses the Messages API;
- sends the current user message plus the system/developer context needed to generate the response;
- Anthropic's published commercial/API retention information states that API inputs and outputs are normally deleted within 30 days, subject to policy-enforcement, legal and separately agreed retention exceptions; eligible customers may arrange zero data retention.

Operational follow-up: before a broader launch, confirm which OpenAI and Anthropic organization/project retention controls and contractual terms are actually active for Mentor AI Corp, and record them in the internal subprocessor register.

## Authentication, database, hosting and billing

Observed service-provider categories match the published policies:

- authentication and database: Supabase;
- hosting/infrastructure: Hostinger production infrastructure plus Supabase database infrastructure;
- AI model processing: OpenAI and Anthropic;
- payment processing: Stripe.

The public policies currently describe provider categories rather than claiming a fixed named subprocessor list. Maintain an internal named register with contract/DPA status, processing locations where known and current retention controls.

## Advertising and tracking audit

No Google Analytics, Google Tag Manager, Meta/Facebook Pixel, PostHog, Plausible, Segment, Mixpanel or equivalent advertising/behavioral analytics dependency or integration was found in the authenticated application code/dependencies reviewed for this audit.

Release rule: advertising pixels, retargeting pixels or behavioral-advertising trackers must not be added to signup, onboarding, mentor, conversation, memory, goal, reflection, feedback, settings or health-related mentor-selection flows without a new privacy/legal review.

## Export behavior

The direct JSON export is expanded in Feature 114 to include:

- user/account database record;
- conversations and messages;
- memories, goals and reflections;
- journal entries;
- feedback;
- usage events;
- subscription record;
- credit account and credit transactions.

This is materially more complete than the previous export, which omitted journal, feedback, usage and billing/credit records.

## Direct mentor-data deletion behavior

The direct `Delete my mentor data` control is expanded in Feature 114 to delete active-database records for:

- messages;
- conversations;
- memories;
- goals;
- reflections;
- journal entries;
- feedback;
- usage events;
- saved mentor selection (`Subscription.selectedMentorSlug` is cleared).

The control deliberately does **not** delete:

- the authentication/sign-in account;
- subscription/billing identifiers;
- credit balances and credit transaction records.

Those records can be required to administer an active subscription, reconcile purchases, prevent fraud and meet legal/accounting obligations. The UI states this boundary explicitly.

A full account/deletion request remains available through the privacy-request process described in the published policies. Full account deletion must include coordinated handling of authentication, active Stripe subscriptions and any legally required billing retention; it should not be implemented as a blind database delete.

## Retention and backups

Current active-application behavior does not implement a universal automatic age-based purge of mentor content. The practical active-data model is therefore:

- mentor content remains while needed for the user's ongoing account/continuity until the user deletes mentor data or a full deletion request is processed;
- direct mentor-data deletion removes the listed active-database mentoring records immediately when the transaction succeeds;
- billing/credit/account records are retained separately where needed for account operation, accounting, fraud prevention or legal obligations;
- provider-side AI request retention is governed by the actual OpenAI/Anthropic account configuration and contracts as described above.

Production Supabase verification on 25 August 2026 shows the `MentorAndI Production` project is in `eu-west-1` and the organization is currently on the **Free** plan. Supabase's current detailed backup documentation states that automatic daily backups are available to Pro, Team and Enterprise projects, and recommends that Free-plan projects regularly create their own off-site database dumps. Therefore the current production project must not be documented internally as having a restorable Supabase daily-backup history.

Production reliability gate before broader launch: either upgrade the production Supabase organization/project to a plan with appropriate managed backups, or establish an automated encrypted off-site backup process with tested restore procedures. Whichever route is chosen must have a documented retention period and a deletion/restoration procedure that prevents intentionally deleted mentor data from being silently reintroduced by a later restore.

## Safety processing

Feature 114 adds a pre-response deterministic crisis-safety layer. High-risk safety events do not send the high-risk message to an LLM because ordinary mentor generation is bypassed. Safety telemetry records only classification, rule ID, override status and a short SHA-256-derived conversation reference; it does not log the message text. `none` classifications are not logged.

This reduces unnecessary propagation of high-risk content while preserving enough metadata for safety operations.

## Policy comparison result

### Aligned

- Policies disclose conversations, memories, goals, reflections, feedback, billing, technical usage and potentially sensitive/consumer-health information.
- Policies disclose AI model processing and provider categories.
- Policies state no sale/targeted advertising of private mentor/consumer-health data; no such tracking implementation was found.
- Policies permit different retention by category and limited legal/security/accounting retention.
- Policies direct users to support for full privacy requests while allowing direct in-app export/deletion controls.

### Fixed in Feature 114

- Direct export previously omitted journal entries, feedback, usage and billing/credit data.
- Direct mentor-data deletion previously omitted journal entries, feedback, usage events and saved mentor selection.
- Safety telemetry now avoids logging ordinary `none` classifications and does not log user message content.

### Remaining operational gates

1. Verify and record actual OpenAI project data-retention control (default vs MAM/ZDR) and contract/DPA status.
2. Verify and record actual Anthropic organization retention agreement/control and contract/DPA status.
3. Resolve the current production backup gap: Supabase Free has no managed daily-backup entitlement described by the detailed backup docs; use an appropriate paid backup plan or automated encrypted off-site dumps.
4. Create and maintain a written full-account privacy-deletion runbook covering Supabase Auth/database, Stripe state, AI-provider retention and any legally retained billing records.
5. Illinois-specific launch position remains pending U.S. counsel; this audit does not resolve that legal question.

## Release conclusion

The application data model and published policies are broadly consistent after the Feature 114 export/deletion fixes. The remaining gaps are operational/contractual verification, production backup resilience and the Illinois legal decision, not an undisclosed advertising use or an unbounded hidden health-data store.

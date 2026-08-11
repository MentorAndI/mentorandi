# Company Stress Mentor

## Product Definition

Company Stress Mentor is a workplace offering priced at **$125 per user per
month with no minimum seats**. It gives each enrolled employee a private mentor
space for stress awareness, sustainable work patterns, boundaries, recovery,
and practical preparation for difficult work situations.

It is not employee surveillance, an HR case-management system, a productivity
scoring tool, clinical treatment, an emergency service, or a channel for an
employer to inspect individual use.

## Employee Experience

Each entitled employee should receive:

- A private Stress Mentor conversation space.
- Practical techniques, exercises, plans, and follow-up appropriate to the
  stress-support scope.
- User ownership and isolation equivalent to consumer mentor conversations.
- Clear information about what is private and what, if anything, may contribute
  to anonymous company-level insights.
- Account privacy, memory, export, and deletion controls appropriate to the
  final legal and contractual model.

The mentor may help with workload reflection, boundaries, recovery routines,
meeting preparation, prioritization, and communication. It must not diagnose
burnout or mental-health conditions, replace clinical care, decide employment
matters, or normalize unsafe working conditions.

## Privacy Promise

The employer never sees individual employee chats. This includes:

- Prompts and mentor responses.
- Conversation transcripts or summaries.
- Memories, goals, reflections, plans, and exercises.
- Individual topics, sentiment, risk labels, or inferred conditions.
- Per-employee usage patterns, timestamps, credit history, or model metadata
  when these could reveal sensitive behavior.
- Identifiers or drill-down links that could reconnect an insight to a person.

Managers, HR, benefit administrators, company admins, and billing contacts must
not gain a technical support path that bypasses this boundary. Legal demands,
safety handling, retention, and account administration require explicit policy
and counsel before launch; no exception should be implied casually in product
copy.

## Anonymous Company-Level Insights

An employer may receive only anonymous, aggregate insights designed to identify
broad organizational patterns. Possible future categories include high-level
themes such as workload pressure, meeting load, recovery barriers, role
ambiguity, or boundary friction, but only after privacy review.

Company insights must:

- Be derived through a separately designed, privacy-preserving aggregation
  process rather than direct access to employee chats.
- Use a minimum cohort/reporting threshold large enough to prevent singling out
  a person; the exact threshold is deliberately TBD.
- Suppress small groups, rare combinations, free text, quotes, and slices that
  could enable re-identification.
- Avoid individual scores, rankings, risk flags, productivity judgments, or
  manager-level drill-down.
- Use a fixed reporting period and minimum signal requirements so timing cannot
  reveal who raised a topic.
- Be reviewed for intersection and differencing attacks across repeated
  reports, teams, locations, and demographic filters.
- State that aggregate signals are directional, not diagnosis or proof about
  an employee or team.

Employer payment does not transfer ownership of employee conversations or make
personal mentor data company property. The company receives the contracted
aggregate product only.

## Seat And Access Model

- Price: $125 per entitled user per month.
- Minimum seats: none; one seat is allowed.
- A company billing administrator may manage invitations, seat status, and
  billing identity only.
- Seat administration must expose the minimum necessary account metadata and
  no mentor content.
- Removing a seat ends company-plan access according to the disclosed billing
  policy; it must not hand the employee's conversations to the employer.
- The future product must decide whether and how an employee can retain or
  migrate personal data after losing a seat. No behavior is assumed here.

A one-seat company can buy the private mentor experience, but cannot receive
company insights about one person. The lack of a sales minimum must never weaken
the anonymity minimum.

## Credits And Usage

Company access remains bounded; it is not unlimited. Exact per-seat credits,
deep-session allowances, renewal, rollover, and extra-pack availability are
commercial decisions still to be made. The company must not receive an
employee-level usage ledger. Billing reconciliation should use seat and
subscription facts, not conversation content.

Operational abuse and safety limits may apply in addition to credits. A paid
seat never bypasses service protection, safety rules, or user ownership checks.

## Separation Of Responsibilities

Stripe should later handle company checkout or subscription billing, payment
state, and signed billing webhooks. MentorAndI should handle verified seat
entitlements, mentor access, credits, usage ledger, employee ownership, privacy
boundaries, and aggregate-insight authorization.

The employer-facing surface and employee mentor surface require separate
authorization. A company admin role must not imply mentor-data access. Every
employee conversation and memory operation must be scoped to the authenticated
employee.

## Safety And Escalation

Company Stress Mentor retains the shared Mentor Core crisis and professional
advice boundaries. It must not report an employee to their employer based on a
conversation, promise confidentiality beyond the approved legal policy, give
employment-law or medical conclusions, or tell a user to remain in an unsafe
workplace.

Emergency and crisis guidance must never depend on plan status, credits, or an
employer report. The exact safety and legal escalation policy requires review
before company launch.

## Decisions Required Before Launch

- Employee consent, privacy notice, controller/processor roles, and applicable
  employment and data-protection law.
- Data retention, deletion, export, and post-employment access.
- Minimum anonymous reporting cohort and anti-re-identification rules.
- Which aggregate categories are permitted and which are prohibited.
- Seat invitations, transfers, removals, billing cycles, and failed payments.
- Company credit allocations and any deep-session allowance.
- Admin roles, support access, audit logs, incident response, and contractual
  commitments.
- Independent privacy, security, legal, and employee-trust review.

## Not Implemented

This is documentation only. It does not create company accounts, seats,
dashboards, aggregate learning, reports, subscriptions, credits, Stripe flows,
database records, or runtime access. It does not change the current Stress /
Burnout Mentor or authorize collection of employee data for employer insights.

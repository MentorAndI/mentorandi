# MentorAndI Investor Demo Script

This is a 5–7 minute walkthrough of the working private alpha. Use a normal
alpha account for mentor flows and an allowlisted admin account for the final
internal view. Do not display private user messages, email addresses, invite
codes, environment values, secrets, or admin data belonging to another person.

## Before the call

- Open staging and confirm `/api/health` returns `status: "ok"`.
- Sign in with the presenter alpha account and have `/demo` ready.
- Keep an allowlisted admin session available in a separate tab.
- Use only the presenter account's real conversations and feedback. Do not seed
  fake users, activity, testimonials, or metrics for the presentation.

## 0:00–0:45 — Frame the product on `/demo`

Open `/demo`.

Say: “MentorAndI is a long-term AI mentoring product, not a general-purpose
chat window. One Mentor Core powers specialized mentor profiles, each with its
own focus, boundaries, expertise, and small practical method library. This is a
private alpha running on staging.”

Point out the proof statements and fixed demo prompts. Explain that the cards
enter the normal authenticated product flow; the demo page is not a simulated
chat experience.

## 0:45–1:30 — Show the mentor lineup

Open `/mentors`.

Show Life, ADHD, Relationship, Stress / Burnout, Parenting, Health & Fitness,
Focus, and Confidence. Briefly explain that the shared engine handles account,
context, safety, model routing, and persistence, while the selected profile
controls the mentoring stance and eligible methods.

Say: “This lets us deepen one platform into multiple mentor experiences without
mixing their conversation histories.”

## 1:30–3:00 — Demonstrate the ADHD Mentor

Choose ADHD Mentor and send:

> I keep avoiding an important task even though I know I need to do it.

Let the response complete. Point out the non-shaming framing, the focus on
starting friction, one practical intervention, and one follow-up question.
Avoid claiming that a particular method will always be selected; selection is
based on the mentor, current message, and recent conversation context.

Say: “The response is generated through the shared Mentor Core, but only ADHD
methods are eligible in this conversation. The method context is deliberately
small so the answer stays human and conversational rather than becoming a list
of frameworks.”

## 3:00–4:15 — Switch to Confidence and prove separation

Return to `/mentors`, choose Confidence Mentor, and send:

> I feel like I am not good enough even when I do well.

Show that the ADHD thread is not present in the Confidence conversation. If
useful, switch back to ADHD and show that its history remains intact.

Say: “The account persists, but the conversation context is mentor-scoped. A
validated mentor selection loads or creates that user's conversation for the
selected mentor. Ownership checks remain in the normal server-side path.”

## 4:15–5:15 — Show the alpha feedback loop

Use the in-product feedback control from the authenticated mentor experience.
Explain that feedback is stored against the authenticated user and can be
reviewed internally.

In the separate allowlisted session, open `/admin`, then `/admin/feedback`.
Only do this in a controlled presentation. Do not link these routes from a
public page and do not reveal private user content.

Say: “The overview gives the alpha team operational visibility, and the
feedback view closes the product-learning loop. Both pages are server-rendered,
require a real Supabase session, and check an email allowlist before reading
cross-user data. These are internal tools, not public dashboards.”

Do not present totals as traction metrics. The alpha admin counts are
operational data, and usage counters are process-local.

## 5:15–6:30 — Explain account, access, and deployment proof

Say: “The alpha has persistent Supabase accounts and database-backed
conversation history. Signup can be protected by a server-side invite code.
Email verification returns through the application's Supabase Auth callback;
the current alpha email-delivery setup uses Resend. Usage limits protect message
and higher-cost model consumption.”

Continue: “Application data is read through server-side Prisma repositories and
ownership-aware services. The security foundation includes RLS hardening,
revoked direct browser table grants, protected development routes, privacy and
terms pages, account export/deletion controls, and internal-only admin access.”

Say: “This is deployed on Hostinger VPS staging. Pushes to `main` run the GitHub
Actions staging workflow, which fast-forward pulls the repository, rebuilds the
Docker Compose service, and fails unless the public health endpoint reports
healthy. A local one-command deployment remains available as a fallback.”

## 6:30–7:00 — Close on what is proven

Say: “What exists today is the alpha product loop: invite a user, verify an
account, choose a specialist, keep mentor-scoped history, generate a response
with specialized methods, capture feedback, and monitor the environment. It is
not finished clinical infrastructure or a scaled commercial system, but it is
a real deployed product foundation rather than a generic-chat mock-up.”

## Questions to answer precisely

- **Are the mentors separate models?** No. One Mentor Core and provider layer
  serves specialized profiles, expertise, boundaries, and method libraries.
- **Is history persistent?** Yes. Accounts and conversations are stored through
  Supabase/PostgreSQL and Prisma; conversation messages are mentor-scoped.
- **Are usage metrics durable?** Not yet. Current usage-limit counters are
  process-local and reset when the app restarts.
- **Is this therapy or medical care?** No. Mentor profiles and the shared prompt
  retain explicit non-diagnostic and crisis/professional-support boundaries.
- **Is security complete?** No security program is ever “complete.” The alpha
  has a concrete foundation: server-side access, ownership checks, RLS
  hardening, protected admin/dev routes, and public privacy controls.

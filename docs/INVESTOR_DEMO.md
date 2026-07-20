# Investor Demo Flow

Feature 106 adds a public, alpha-safe overview at `/demo`. It presents
MentorAndI as one Mentor Core with multiple specialized profiles, and makes the
product easy to demonstrate without exposing internal administration pages or
inventing users, activity, or metrics.

## Demo path

1. Open `/demo`.
2. Choose ADHD, Relationship, Confidence, Stress / Burnout, or Life.
3. The link opens `/mentor?mentor=<slug>`.
4. The server validates the mentor slug and loads that mentor's conversation.
5. The user enters the fixed demo prompt shown on the scenario card and sends
   it through the normal mentor response flow.

Demo selection does not create a parallel chat system. It reuses the existing
mentor session and response boundaries from Features 105B and 105C. Each mentor
loads or creates only its own persisted conversation; changing URL parameters
cannot attach another mentor to an existing conversation.

Unauthenticated visitors can read `/demo`. Starting a scenario follows the
normal `/mentor` authentication behavior for the environment. The page links
only to public/product routes and does not link to `/admin` or
`/admin/feedback`. Admin authorization remains server-side and allowlist-only.

## Product claims shown

The page briefly describes the implemented alpha foundations: persistent
accounts, conversation history, mentor specialization, authenticated feedback,
allowlisted internal monitoring, usage limits, and server-side privacy and
ownership controls. It labels the experience as private alpha/demo and does not
show fake metrics, testimonials, users, or activity.

## Verification

`npm run smoke:alpha` includes `/demo` as a public non-redirecting route. Also
verify that each scenario opens the expected mentor and never displays messages
from another mentor profile.

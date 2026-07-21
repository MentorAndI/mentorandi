# Investor Demo Flow

Features 106 and 108 provide a public, alpha-safe overview at `/demo`. It presents
Mentor And I as one Mentor Core with multiple specialized profiles, and makes the
product easy to demonstrate without exposing internal administration pages or
inventing users, activity, or metrics.

The presenter-ready narration is in `docs/INVESTOR_DEMO_SCRIPT.md`. A concise
capability inventory with implementation evidence and current limitations is in
`docs/ALPHA_PROGRESS_PROOF.md`.

The page includes a 5–7 minute presenter script. It walks through the full
mentor lineup, an ADHD task-avoidance response, a switch to Confidence, proof
of separated mentor history, authenticated feedback, internal-only admin
monitoring, usage limits, and the privacy/security foundation. Presenter links
open only public or normal authenticated product routes. Admin pages remain
unlinked and allowlist-protected.

## Demo path

1. Open `/demo` and follow the eight-step run-of-show.
2. Preview `/mentors`, then open the ADHD Mentor.
3. Send the fixed ADHD task-avoidance prompt and discuss the response.
4. Switch to Confidence and show that its persisted conversation is separate.
5. Explain authenticated feedback and allowlisted internal monitoring.
6. Close on usage limits, privacy/security controls, and VPS staging.

The five scenario cards remain available for ADHD, Relationship, Confidence,
Stress / Burnout, and Life, each with its fixed demonstration prompt and a link
to the matching validated mentor context. Each card also names two relevant
method frames from that mentor's own library so the presenter can explain the
substantive specialization behind the response without claiming that both
methods will be used.

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

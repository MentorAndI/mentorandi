# Onboarding Intake

## Current Entry Flow

Email/password signup is open and does not require an alpha invite code.
Supabase Auth remains responsible for account creation, password security,
sessions, and email confirmation. When confirmation is required, the email link
returns through `/auth/callback` and defaults to `/onboarding`.

An immediately authenticated signup and an ordinary login also default to
`/onboarding`. Explicit safe internal `next` destinations remain supported.
The onboarding route is authentication-protected.

## Plan Safety

Pricing links may open signup with `?plan=free`, `single`, `plus`, or `premium`.
The selected value is carried to onboarding as context only. It cannot create a
subscription or unlock mentors. A newly created app user has no active paid
subscription row, so production and staging access policy fails down to Free
Trial and Life Mentor only unless an independently valid subscription exists.

Stripe and payment activation are outside this flow.

## Completion State

The current schema has no persisted onboarding-completion field. This feature
therefore makes onboarding the safe default entry point without claiming that
completion can yet be distinguished server-side. A later reviewed feature can
persist intake answers and completion state, then route completed users past
onboarding without changing the open-signup or Free-default guarantees.

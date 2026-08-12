# Alpha Invite Management (Legacy)

> Feature 110B removed this gate from signup. The invite administration model
> and tools remain for historical/internal use, but `/signup` no longer accepts,
> validates, or consumes an invite code. See `docs/ONBOARDING_INTAKE.md`.

Database-backed `AlphaInvite` records are retained as legacy internal records.
Allowlisted admins can still create and revoke them at `/admin/invites`.
Generated codes use high-entropy randomness, are shown once, and are stored only
as a SHA-256 hash plus a short display preview.

An invite can be restricted to a normalized email, given an expiry and note,
and configured for one or more uses. These properties are no longer evaluated
by signup, and signup does not update invite use counters or user references.

## Retired Environment Fallback

`ALPHA_INVITE_CODE` is not read by signup and is not required by environment
validation. Existing deployments may remove it from their environment at an
operator-chosen time; its presence has no signup effect.

The browser sends only email, password, and an optional safe onboarding path to
`/api/auth/signup`. Supabase email confirmation still returns through
`/auth/callback` and follows the safe onboarding destination.

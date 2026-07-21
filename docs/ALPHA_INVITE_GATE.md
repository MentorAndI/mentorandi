# Alpha Invite Management

Database-backed `AlphaInvite` records are the primary private-alpha access
mechanism. Allowlisted admins create and revoke them at `/admin/invites`.
Generated codes use high-entropy randomness, are shown once, and are stored only
as a SHA-256 hash plus a short display preview.

An invite can be restricted to a normalized email, given an expiry and note,
and configured for one or more uses. Signup rejects revoked, expired, exhausted,
or email-mismatched records. The use counter and user reference are updated only
after Supabase account creation and local application-user creation succeed.

## Emergency environment fallback

Configure the server-side environment variable only when a fallback is needed:

```env
ALPHA_INVITE_CODE=
```

- `ALPHA_INVITE_CODE` is an emergency/development fallback, not the primary
  invite mechanism.
- Its exact value is accepted when no database record matches, including during
  a temporary invite-database lookup failure.
- When it is empty or absent, a valid active database invite is required.
- Login and existing accounts are unaffected.

The browser sends the entered value to `/api/auth/signup`, but stored hashes and
the configured fallback remain server-only. The server validates the code before
calling Supabase Auth. Keep any fallback in VPS secrets and never commit it. Raw
database invite codes are not logged, listed, or recoverable from the database.

After changing the fallback, rebuild or restart every app process. Email
confirmation still returns through `/auth/callback` and follows the safe
onboarding destination.

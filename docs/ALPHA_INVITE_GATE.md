# Alpha Invite Gate

MentorAndI can require an invite code before creating a Supabase account.

Configure the server-side environment variable:

```env
ALPHA_INVITE_CODE=
```

- When `ALPHA_INVITE_CODE` has a value, `/signup` requires an exact matching
  code. A missing or incorrect code returns `Invalid alpha invite code.` and
  Supabase signup is not called.
- When it is empty or absent, signup behaves as before and the invite-code field
  is optional.
- Login and existing accounts are unaffected.

The browser sends the entered value to `/api/auth/signup`, but the configured
code remains server-only and is never included in the client bundle or response.
The server validates the code before calling Supabase Auth. Keep the configured
value in VPS secrets and never commit it.

After changing the value, rebuild or restart every app process so each instance
uses the same gate configuration. Email confirmation still returns through
`/auth/callback` and continues to `/start` by default.

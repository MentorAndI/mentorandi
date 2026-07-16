# Alpha Legal, Privacy And Contact Pages

MentorAndI provides three public trust pages for alpha users:

- `/privacy` explains the information stored for the mentor experience, product
  improvement, deletion requests and third-party providers.
- `/terms` explains the alpha nature of the service, professional-advice
  limitations, emergency limitations and acceptable use.
- `/contact` shows the configured alpha support email or tells invited users to
  contact the person who invited them.

The wording is intentionally short and non-legalistic. It is alpha product
wording, not final legal counsel. It should be reviewed and replaced with
approved legal language before a broader public launch.

## Support Email

Set the optional server-side environment variable:

```env
ALPHA_SUPPORT_EMAIL=support@example.com
```

If it is absent or not shaped like an email address, `/contact` displays:

> Contact support through the person who invited you.

The address must stay in deployment configuration rather than source control.
Rebuild or restart the application after changing it.

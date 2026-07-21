# Alpha Tester Guide

The public `/alpha` page gives invited testers one simple place to understand
the private-alpha flow.

It covers:

- signup with the invite code and email verification;
- signed-out signup/login actions and signed-in mentor/Life-mentor actions;
- mentor selection as the default next step after a new signup;
- the first mentor conversation and a 5–10 message continuation;
- logout, login and conversation-history checks;
- authenticated feedback from `/start` or `/mentor`;
- avoiding highly sensitive information during alpha;
- the medical, legal, financial and emergency-advice boundaries;
- a useful bug-report format; and
- links to signup, login, mentors, demo, privacy, terms and contact.

The page is public so it can be shared with invited testers before they create
an account. It reads only the server-side authentication state needed to choose
appropriate next-step links; it does not expose or link to internal admin pages
and does not store user data.

`/start` and `/mentors` each include the same compact first-use guidance:
choose the mentor closest to the situation, write naturally, and use the
authenticated Feedback button to help improve the alpha.

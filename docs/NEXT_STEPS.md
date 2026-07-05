# MentorAndI Next Steps

## Immediate Next Features

1. Improve goal dedupe and goal updates.
2. Add reflection UI or internal dev visibility.
3. Test real provider connectivity, usage diagnostics, model routing, cost controls, `npm run eval:mentor` and `npm run eval:models` before alpha; production alpha must use OpenAI or Anthropic, OpenAI quota/billing must work, and Claude requires `ANTHROPIC_API_KEY` plus `ANTHROPIC_MODEL`.
4. Use the deployment health check to verify alpha environment readiness.
5. Expand account/privacy controls with Supabase auth deletion and compliance workflows.
6. Deploy alpha on the selected VPS or hosting platform.
7. Polish the mentor UI and account settings experience.
8. Add basic logging/error handling.
9. Expand provider diagnostics and logging after real provider testing.
10. Run alpha and VPS smoke tests after deployment and add them to CI/CD.
11. Evaluate cheaper daily-use models while keeping Sonnet-class models available for premium/deeper mentoring moments.
12. Compare Claude Sonnet, Claude Haiku and OpenAI mini-class models before alpha, choose the default model based on quality and cost, and use stronger models only when routing requires it.

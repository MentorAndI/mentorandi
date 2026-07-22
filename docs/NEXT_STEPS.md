# Mentor And I Next Steps

## Immediate Next Features

1. Use `docs/CODEX_TASKS.md` as the source of truth for short Codex feature prompts and the upcoming Feature 086+ backlog.
2. Improve goal dedupe and goal updates.
3. Add reflection UI or internal dev visibility.
4. Run `npm run eval:mentor` and `npm run eval:models` with real providers before alpha; production alpha must use OpenAI or Anthropic, OpenAI quota/billing must work, and Claude requires `ANTHROPIC_API_KEY` plus `ANTHROPIC_MODEL`.
5. Use `docs/ALPHA_DEPLOYMENT_CHECKLIST.md` and the deployment health check to verify alpha environment readiness.
6. Expand account/privacy controls with Supabase auth deletion and compliance workflows.
7. Deploy alpha on the selected VPS or hosting platform.
8. Polish the mentor UI and account settings experience.
9. Add basic logging/error handling.
10. Expand provider diagnostics and logging after real provider testing.
11. Run alpha and VPS smoke tests after deployment and add them to CI/CD.
12. Evaluate cheaper daily-use models while keeping Sonnet-class models available for premium/deeper mentoring moments.
13. Compare Claude Sonnet, Claude Haiku and OpenAI mini-class models before alpha, choose the default model based on quality and cost, and use stronger models only when routing requires it.
14. Configure cheap/default routing for normal daily chat and deep routing for higher-value mentor moments; keep mock provider usage limited to development and deterministic tests.
15. Complete the payments launch checklist in `docs/PAYMENTS_READINESS.md`:
    approve final pricing and plan benefits, configure live Stripe products,
    register and test the production webhook, review taxes/legal/refunds, and
    explicitly enable checkout only after end-to-end production validation.

# Mentor And I — Production Processor / Subprocessor Register

Last reviewed: 25 August 2026

Purpose: internal operational register of external services that may process Mentor And I production data. Public privacy pages may describe categories rather than this named list. Account-specific contract and retention settings must be verified by an authorized company owner.

| Provider | Production purpose | Data potentially processed | Current implementation / retention note | Account/contract verification |
| --- | --- | --- | --- | --- |
| Supabase | Authentication; Postgres database | account identifiers, authentication data, all application database records including conversations and derived mentor data | Production project `MentorAndI Production` is in EU West (`eu-west-1`). Organization is currently Free. Leaked-password protection is unavailable on Free. Detailed Supabase backup docs direct Free projects to maintain their own off-site backups rather than relying on managed daily backups. | Upgrade/backup decision required. Verify DPA/SCC acceptance and production account ownership. |
| Hostinger | VPS/application hosting and container runtime | application HTTP traffic, server logs, environment configuration; application processes database/API data in memory | Do not intentionally log mentor message content. Safety telemetry is content-free. | Verify current DPA, server region, log retention and access controls. |
| OpenAI | AI mentor response generation | current message plus relevant mentor/system/context data | Responses API integration sets `store: false`. Public API data-control docs state default abuse-monitoring logs may retain customer content up to 30 days unless approved Modified Abuse Monitoring / Zero Data Retention applies. API business data is not used for model training by default under current business/API terms. | Verify Mentor AI Corp project is on intended retention mode (default/MAM/ZDR), DPA status and data residency choice. |
| Anthropic | Alternative AI mentor response generation | current message plus relevant system/context data | Messages API. Anthropic public commercial/API privacy information states API inputs/outputs are normally deleted within 30 days, with policy/legal/contractual exceptions; eligible customers may have a ZDR agreement. Commercial inputs/outputs are not used for model training by default unless the customer opts in/provides feedback under applicable terms. | Verify organization retention/ZDR status and commercial DPA/terms acceptance. |
| Stripe | Subscription, checkout, top-up payments and customer portal | customer/billing identifiers, plan, transaction/payment data; no mentor conversation content should be sent | Mentor And I stores Stripe customer/subscription identifiers and transaction linkage; card data is handled by Stripe-hosted payment surfaces. | Verify DPA/data-transfer terms, tax configuration and accounting retention requirements. |

## Prohibited additions without review

Do not add any of the following to authenticated or health-related product flows without updating this register and completing a privacy/legal review first:

- advertising pixels or retargeting services;
- behavioral analytics/session replay;
- support widgets that ingest page/conversation content;
- new LLM or safety-classification providers;
- IP geolocation/jurisdiction vendors;
- external logging or observability drains containing user identifiers or request bodies.

## Change control

For each new production processor record:

1. purpose and minimum data fields;
2. controller/processor role;
3. DPA/contract status;
4. processing/storage locations where known;
5. retention controls;
6. model-training or secondary-use settings where relevant;
7. deletion/request handling;
8. security/access controls;
9. public-policy update need;
10. approval owner and review date.

Do not mark an account-specific setting as enabled based only on the provider's public availability of that feature. Verify the actual Mentor AI Corp production account configuration.

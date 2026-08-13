# Mentor And I — application compliance backlog

Raised by the U.S. AI / mental-health legal hardening review, 13 August 2026.

This is the canonical application-side compliance backlog. The marketing website keeps a shorter bridge document, but implementation work belongs here.

Governing rule: public legal and safety pages must describe what the product actually does. Do not publish stronger safety, privacy, clinical or regulatory claims before the corresponding runtime behavior has shipped and been verified.

## Priority A — before broader external alpha

### 1. In-app AI identity disclosure

Add clear disclosure in the mentor experience that the active mentor is an AI mentor, not a human or licensed therapist, and that Mentor And I provides mentoring and self-help support rather than therapy, diagnosis or emergency care.

Requirements:
- show the disclosure at the start of a mentor interaction;
- use the active mentor name;
- keep it clear but visually restrained;
- support periodic reminder logic for jurisdictions that require repeated disclosure;
- do not rely on the public website footer as the only disclosure.

### 2. Runtime crisis-safety layer

Current state:
- the central mentor prompt contains an emergency-safety instruction;
- this is a prompt safeguard only;
- there is no independent pre-response runtime detection/classification layer today.

Build and verify:
- pre-response crisis-safety evaluation before the normal mentor response;
- risk classification appropriate to the product's safety design;
- deterministic override for high-risk cases so ordinary mentoring does not continue unchanged;
- dedicated crisis-handling response path;
- appropriate human/emergency-resource referral behavior;
- privacy-conscious event logging sufficient for safety evaluation without exposing unnecessary conversation content;
- regression/evaluation tests for representative high-risk, ambiguous and benign messages;
- failure-safe behavior when the safety layer is unavailable.

Only after this ships and passes tests may the public AI Safety page be strengthened to describe the implemented runtime safeguards.

Do not claim clinical validation, evidence-based screening or similar properties unless separately verified.

### 3. Affirmative 18+ signup confirmation

The Terms currently state 18+, but signup must affirmatively collect the user's confirmation.

Add a required checkbox or equivalent control:

`I confirm that I am 18 years of age or older.`

Requirements:
- unchecked by default;
- required before account creation;
- accessible label and validation;
- covered by signup regression tests.

Do not build a minor-directed product without a separate legal, privacy, safety and product review.

### 4. Persona and relationship safety

Maintain warmth, continuity and memory while keeping the AI nature of the mentors clear.

The app must not imply that a mentor:
- is a human being;
- has human feelings or needs;
- depends emotionally on the user;
- should replace human relationships;
- should be kept secret from family or professionals;
- is the user's therapist or clinician;
- has a therapist-client, doctor-patient or other clinical relationship with the user.

The intended position is: a consistent AI mentor that knows relevant user context, not a synthetic human being.

Review mentor system prompts, specialization prompts and UI copy against this boundary.

### 5. Illinois launch decision

Treat Illinois as an explicit unresolved launch/compliance decision pending U.S. counsel review against the actual Mentor And I product behavior.

Until reviewed:
- do not market Mentor And I as therapy;
- do not claim therapeutic or mental-health treatment outcomes;
- do not allow mentor prompts/copy to imply diagnosis or treatment;
- keep geofencing or restricted functionality available as a product option if counsel requires it.

Do not place speculative Illinois-law statements on the public website.

## Priority B — privacy/data verification before broader external alpha or production

### 6. Consumer health data implementation audit

Compare the live application with the published Consumer Health Data Privacy Policy and general Privacy Policy.

Verify and document:
- health-related data categories actually stored;
- health-related information inferred into memories, goals or reflections;
- purposes for which those data are used;
- whether any such data are used beyond providing/security/administering the requested service;
- retention periods by category;
- account deletion behavior and what survives deletion;
- export behavior;
- actual service-provider/subprocessor categories;
- international data-flow implications where applicable.

Any mismatch must be resolved either by changing the implementation or changing the public policy before broader launch.

### 7. Advertising and tracking prohibition

Do not deploy advertising pixels, retargeting pixels or behavioral-advertising trackers in sensitive application flows without separate legal/privacy review.

This includes:
- signup and onboarding;
- authenticated mentor pages;
- conversations;
- goals;
- memories;
- reflections;
- feedback;
- account/settings;
- health-related mentor-selection events.

Do not send conversation content, health-related mentor selections, health inferences or user identifiers associated with sensitive interactions to advertising platforms.

Any future analytics addition in these areas requires a separate privacy/legal review and must remain consistent with the published Cookie and Privacy policies.

## Permanent release rules

### 8. No unverified regulated/clinical claims

Do not publish claims such as the following unless separately verified and approved:
- HIPAA compliant;
- clinically validated;
- FDA approved;
- medical grade;
- therapist-level;
- evidence-based crisis detection.

### 9. Legal-page synchronization

Whenever a compliance-relevant runtime feature changes, verify whether any of these public pages require a matching update:
- Terms of Use;
- Privacy Policy;
- Consumer Health Data Privacy Policy;
- AI Safety;
- Cookie Policy.

The website must never describe safeguards or data practices that are stronger or materially different from the implemented application behavior.

## Suggested implementation order

1. In-app AI identity disclosure.
2. Affirmative 18+ signup confirmation.
3. Runtime crisis-safety layer and tests.
4. Persona/relationship safety audit across prompts and UI.
5. Consumer-health-data implementation audit.
6. Illinois counsel/product decision before wider U.S. rollout.
7. Final legal-page synchronization and external-alpha release gate.

Keep these tasks small and independently testable. Do not combine them with unrelated UI redesign, billing launch or production deployment work.

# Illinois Launch Gate

Status as of 25 August 2026: **DO NOT MARK ILLINOIS AS APPROVED FOR GENERAL CONSUMER LAUNCH WITHOUT U.S. COUNSEL REVIEW.**

This is an operational product gate, not a legal opinion.

## Current law identified

Illinois Public Act 104-0054, the Wellness and Oversight for Psychological Resources Act (225 ILCS 155), became effective 1 August 2025.

The Act prohibits an individual, corporation or entity from providing, advertising or offering therapy or psychotherapy services to the public in Illinois unless the services are conducted by a licensed professional. The statute expressly includes Internet-based artificial intelligence in that prohibition.

The enacted definition of “therapy or psychotherapy services” includes services provided to diagnose, treat, or improve an individual's mental health or behavioral health.

The Act also restricts a licensed professional from allowing AI to make independent therapeutic decisions, directly interact with clients in therapeutic communication, generate therapeutic recommendations/treatment plans without review, or detect emotions/mental states.

## Mentor And I product position

Current product controls deliberately state that Mentor And I:

- is an AI mentoring/self-help product;
- is not human;
- is not therapy;
- does not diagnose or treat;
- is not emergency care;
- does not replace licensed professionals;
- maintains mentor-specific boundaries against diagnosis and treatment.

These controls reduce misleading positioning, but product disclaimers do not by themselves determine whether a regulator or court would consider particular functionality to fall within a statutory definition.

Several Mentor And I domains — for example stress/burnout support, ADHD-related executive-function support, emotional clarity, relationship support and health/wellness mentoring — can overlap factually with topics that consumers also discuss in mental-health settings. Therefore Illinois must remain a legal launch gate.

## Interim launch rule

Until U.S. counsel provides a written Illinois position:

1. Do not state internally or publicly that Illinois launch is approved.
2. Do not intentionally target Illinois-specific advertising or campaigns.
3. Do not describe Mentor And I as therapy, psychotherapy, treatment, diagnosis or a substitute for a licensed clinician.
4. Keep the in-app AI/non-therapy disclosure and persona boundaries enabled.
5. If a broad U.S. consumer launch occurs before counsel clearance, implement a reliable Illinois access restriction rather than relying only on disclaimers or terms text.

## Requirements for an Illinois access restriction if needed

A compliant technical exclusion should be server-enforced and cover at least:

- account creation;
- paid checkout;
- free-trial activation;
- mentor response endpoints;
- existing-account access where the user is determined to be in the excluded jurisdiction.

Do not rely solely on a client-side hidden button. A production design should define how jurisdiction is determined (for example verified account/billing state plus appropriate geolocation controls), how false positives/appeals are handled, and how jurisdiction data is minimized and retained.

Adding a new geolocation/vendor dependency requires a privacy/subprocessor review before deployment.

## Counsel questions

Obtain written advice on at least:

1. Whether Mentor And I's mentoring/self-help functions fall outside or within 225 ILCS 155's definition of therapy or psychotherapy services.
2. Whether any mentor domains/features can be offered in Illinois while others must be restricted.
3. Whether disclaimers, AI identification, non-diagnostic boundaries and crisis routing materially affect the analysis.
4. What constitutes “offer ... to the public in this State” for an online service and what technical geofencing standard is appropriate.
5. Whether existing Illinois users require a transition/restriction process.
6. Whether Illinois's Artificial Intelligence Companion Model Safety Act (effective 2027 provisions) creates additional future requirements for this product.

## Release status

- Illinois: **BLOCKED pending counsel or implemented exclusion.**
- Other jurisdictions: evaluate under their applicable law; this document does not provide a general U.S. clearance.

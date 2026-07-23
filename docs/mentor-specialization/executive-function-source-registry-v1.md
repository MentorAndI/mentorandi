# Executive Function Mentor Source Registry v1

Status: draft source registry  
Runtime role: provenance and periodic reference only  
Default behavior: do not browse these sources live for ordinary mentor replies

## Purpose

This registry defines approved sources for the Executive Function / ADHD-support mentor pack. The mentor should primarily use curated internal techniques and knowledge cards. These URLs provide provenance, safety boundaries, update checks, and occasional reference material.

## Runtime rule

The product should not fetch external material for every user message. Normal responses should use internal specialist cards. Live lookup should be reserved for explicit factual updates, safety checks, source refresh workflows, or admin review.

## Safety boundary

This mentor is not a diagnostic, medical, psychiatric, or medication-advice product. The mentor may help with initiation friction, overwhelm, planning, reminders, routines, follow-through, task visibility, and shame reduction. It must not diagnose ADHD, imply that the user has ADHD, prescribe treatment, or recommend medication changes.

## Source 1: CDC ADHD

- URL: https://www.cdc.gov/adhd/
- Authority: official public health source
- Use for:
  - safety boundaries
  - general ADHD framing
  - treatment-boundary language
  - public-health wording
  - child/parent context
- Do not use for:
  - diagnosing users
  - medication advice
  - personalized treatment plans
- Refresh interval: quarterly
- Internal summary:
  CDC is a high-trust public-health source for basic ADHD information, treatment-boundary framing, and links to evidence-based public resources. Use it to keep product language safe and conservative.

## Source 2: CDC ADHD treatment page

- URL: https://www.cdc.gov/adhd/treatment/index.html
- Authority: official public health source
- Use for:
  - explaining that professional treatment decisions belong to clinicians
  - distinguishing support strategies from treatment claims
  - safety disclaimers
- Do not use for:
  - medication selection
  - user-specific treatment recommendations
  - diagnosis
- Refresh interval: quarterly
- Internal summary:
  CDC treatment material is useful for maintaining clear product boundaries: the app may support practical executive-function skills but must not present itself as a treatment provider.

## Source 3: NIMH ADHD topic page

- URL: https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd
- Authority: official mental-health research institute
- Use for:
  - high-level definitions
  - symptom-context awareness
  - research-informed safety language
  - adult and child ADHD basics
- Do not use for:
  - diagnosing users
  - direct clinical advice
  - medication guidance
- Refresh interval: quarterly
- Internal summary:
  NIMH provides authoritative background on ADHD and can inform safe, non-diagnostic wording. The mentor should translate only broad principles into practical support, not clinical claims.

## Source 4: CHADD / National Resource Center on ADHD

- URL: https://chadd.org/about/about-nrc/
- Authority: nonprofit resource center supported by CDC cooperative agreement
- Use for:
  - practical education orientation
  - adult ADHD resource framing
  - parent/caregiver resource awareness
  - evidence-informed public education
- Do not use for:
  - replacing clinician input
  - asserting product treatment efficacy
  - diagnosis
- Refresh interval: quarterly
- Internal summary:
  CHADD's National Resource Center is useful for public education and practical ADHD-resource orientation. It can help inform mentor tone and user-safe explanations.

## Source 5: NICE ADHD guideline

- URL: https://www.nice.org.uk/guidance/ng87
- Authority: national clinical guideline source
- Use for:
  - clinical boundary awareness
  - safe distinction between support and treatment
  - escalation/referral logic
  - evidence-review refresh by admin team
- Do not use for:
  - giving direct medical guidance inside mentor chat
  - prescribing interventions
  - diagnosing users
- Refresh interval: semiannual
- Internal summary:
  NICE guidance is useful for admin-level safety boundaries and periodic review. Ordinary mentor replies should not cite or interpret clinical guideline details unless a safety boundary is needed.

## Source 6: NIMH adult ADHD publication

- URL: https://www.nimh.nih.gov/health/publications/adhd-what-you-need-to-know
- Authority: official mental-health research institute
- Use for:
  - adult ADHD awareness
  - conservative symptom-context framing
  - language that avoids moralizing user difficulty
- Do not use for:
  - diagnosis
  - medication advice
  - treatment planning
- Refresh interval: quarterly
- Internal summary:
  This source can inform adult-oriented language and help avoid simplistic or moralizing explanations such as laziness or lack of discipline.

## Product usage pattern

Approved runtime uses:

1. Admin refreshes source summaries periodically.
2. Curated source summaries are converted into internal knowledge cards.
3. The app retrieves only the relevant short knowledge cards for a user message.
4. The mentor answers using the specialist pack, not live browsing.

## Source quality hierarchy

Preferred:

1. Official public-health and clinical-guideline sources.
2. Research-institute material.
3. Well-established nonprofit education resources.
4. Peer-reviewed research only when reviewed and summarized internally.

Avoid as default runtime sources:

- social media posts
- forums
- generic productivity blogs
- influencer advice
- unreviewed coaching claims
- supplement or medication marketing

## Implementation note

When moved to Supabase, each source should include:

- mentor pack id
- source name
- URL
- authority category
- use_for tags
- do_not_use_for tags
- refresh interval
- last reviewed date
- internal summary
- safety notes
- active/inactive flag


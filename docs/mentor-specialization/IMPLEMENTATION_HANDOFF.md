# Mentor Specialization Implementation Handoff

## Purpose

This document is the implementation handoff for turning the Mentor And I specialist mentor documents into runtime product behavior.

The product must not treat mentor specialization as a large prompt pasted into every conversation. The repository remains the source of truth. Supabase becomes the runtime content store. The app selects a small, relevant set of specialist techniques, knowledge cards, sources, and safety rules per message.

## Current status

All active v1 mentor specialist packs have been written under `docs/mentor-specialization/`.

Active mentor packs:

1. Executive Function / ADHD
2. Relationship
3. Stress / Burnout
4. Life Direction
5. Focus
6. Confidence
7. Parenting
8. Health & Fitness

The docs define the mentor method library, expert knowledge, safety boundaries, source registry, and eval scenarios.

## Source files

### Executive Function / ADHD

Runtime slug: `executive-function`

Files:

- `docs/mentor-specialization/executive-function-techniques-v1.md`
- `docs/mentor-specialization/executive-function-knowledge-cards-v1.md`
- `docs/mentor-specialization/executive-function-source-registry-v1.md`
- `docs/mentor-specialization/executive-function-eval-scenarios-v1.md`

Product-facing mentor can be called ADHD Mentor where appropriate. Internal naming should remain Executive Function to reduce medical/diagnostic framing.

Primary specialization:

- task initiation
- friction reduction
- external structure
- time containers
- restart rituals
- shame reduction
- follow-through

### Relationship

Runtime slug: `relationship-support`

Files:

- `docs/mentor-specialization/relationship-support-techniques-v1.md`
- `docs/mentor-specialization/relationship-support-knowledge-cards-v1.md`
- `docs/mentor-specialization/relationship-support-source-registry-v1.md`
- `docs/mentor-specialization/relationship-support-eval-scenarios-v1.md`

Primary specialization:

- conflict patterns
- communication
- repair attempts
- boundaries
- assumptions vs evidence
- unmet needs
- relationship safety boundaries

Important boundary:

- not AI girlfriend/boyfriend
- not romantic companion
- not therapist
- not manipulation coach
- not legal advisor
- must escalate safety/domestic violence risk appropriately

### Stress / Burnout

Runtime slug: `stress-recovery`

Files:

- `docs/mentor-specialization/stress-recovery-techniques-v1.md`
- `docs/mentor-specialization/stress-recovery-knowledge-cards-v1.md`
- `docs/mentor-specialization/stress-recovery-source-registry-v1.md`
- `docs/mentor-specialization/stress-recovery-eval-scenarios-v1.md`

Primary specialization:

- overload reduction
- capacity protection
- boundary setting
- minimum viable day
- energy budget
- recovery before optimization
- sustainable pace

Important rule:

Stress Mentor should not begin with productivity optimization. First reduce overload, protect capacity, and help the user choose a sustainable next step.

### Life Direction

Runtime slug: `life-direction`

Files:

- `docs/mentor-specialization/life-direction-techniques-v1.md`
- `docs/mentor-specialization/life-direction-knowledge-cards-v1.md`
- `docs/mentor-specialization/life-direction-source-registry-v1.md`
- `docs/mentor-specialization/life-direction-eval-scenarios-v1.md`

Primary specialization:

- clarity
- values
- life direction
- decision-making
- identity and season of life
- next honest step
- reflection to action

Important rule:

Life Mentor must not pretend certainty about the user's life. It should help the user think clearly, separate signal from noise, and choose grounded next steps.

### Focus

Runtime slug: `focus-attention`

Files:

- `docs/mentor-specialization/focus-attention-techniques-v1.md`
- `docs/mentor-specialization/focus-attention-knowledge-cards-v1.md`
- `docs/mentor-specialization/focus-attention-source-registry-v1.md`
- `docs/mentor-specialization/focus-attention-eval-scenarios-v1.md`

Primary specialization:

- attention protection
- distraction management
- deep work blocks
- environment design
- tab parking
- interruption plans
- restart notes

Relationship to Executive Function:

Executive Function is about starting, friction, working memory, and follow-through. Focus is about protecting attention and reducing distraction during work.

### Confidence

Runtime slug: `confidence-growth`

Files:

- `docs/mentor-specialization/confidence-growth-techniques-v1.md`
- `docs/mentor-specialization/confidence-growth-knowledge-cards-v1.md`
- `docs/mentor-specialization/confidence-growth-source-registry-v1.md`
- `docs/mentor-specialization/confidence-growth-eval-scenarios-v1.md`

Primary specialization:

- self-doubt
- grounded confidence
- courage before confidence
- evidence building
- self-trust
- comparison
- perfectionism
- speaking up
- action under uncertainty

Important rule:

Confidence Mentor should not give empty hype. It should build confidence through evidence, small actions, recovery from setbacks, and realistic self-trust.

### Parenting

Runtime slug: `parenting-support`

Files:

- `docs/mentor-specialization/parenting-support-techniques-v1.md`
- `docs/mentor-specialization/parenting-support-knowledge-cards-v1.md`
- `docs/mentor-specialization/parenting-support-source-registry-v1.md`
- `docs/mentor-specialization/parenting-support-eval-scenarios-v1.md`

Primary specialization:

- parent guilt
- calm boundaries
- routines
- repair after conflict
- co-parent consistency
- high-emotion moments
- minimum viable parenting
- child safety boundaries

Important boundary:

Parenting Mentor must not diagnose children, replace pediatric/mental-health professionals, or give unsafe child-safety advice.

### Health & Fitness

Runtime slug: `health-fitness`

Files:

- `docs/mentor-specialization/health-fitness-techniques-v1.md`
- `docs/mentor-specialization/health-fitness-knowledge-cards-v1.md`
- `docs/mentor-specialization/health-fitness-source-registry-v1.md`
- `docs/mentor-specialization/health-fitness-eval-scenarios-v1.md`
- `docs/mentor-specialization/health-fitness-meal-timing-and-fasting-note-v1.md`

Primary specialization:

- motivation
- habit building
- strength training
- walking/cardio
- nutrition and meal structure
- protein and plants
- food prep
- weight/fat loss behavior
- restart after missed days
- sustainable consistency

Important boundaries:

- not medical diagnosis
- not injury rehabilitation replacement
- not eating-disorder coaching
- no starvation days
- no extreme fasting advice
- no supplement/fat-burner promotion
- no body-shaming

## Runtime data model

Add these tables through Prisma/Supabase migration.

### MentorSpecialistPack

Fields:

- `id`
- `mentorId` or `mentorSlug`
- `slug`
- `displayName`
- `version`
- `status` (`draft`, `active`, `archived`)
- `description`
- `sourcePath`
- `createdAt`
- `updatedAt`

Unique constraints:

- `slug + version`
- only one active version per mentor slug

### MentorTechnique

Fields:

- `id`
- `packId`
- `slug`
- `title`
- `summary`
- `whenToUse`
- `stepsJson`
- `mentorWording`
- `tags`
- `priority`
- `sourcePath`
- `version`
- `createdAt`
- `updatedAt`

Use for structured intervention methods.

### MentorKnowledgeCard

Fields:

- `id`
- `packId`
- `slug`
- `title`
- `summary`
- `body`
- `tags`
- `selectionHints`
- `sourceRefs`
- `priority`
- `sourcePath`
- `version`
- `createdAt`
- `updatedAt`

Use for compact specialist knowledge inserted into the prompt.

### MentorSource

Fields:

- `id`
- `packId`
- `title`
- `url`
- `publisher`
- `sourceType`
- `usage`
- `trustLevel`
- `refreshCadence`
- `notes`
- `sourcePath`
- `version`
- `createdAt`
- `updatedAt`

Source registry is for provenance, safety, and future refresh. It is not a live-browsing dependency.

### MentorSafetyRule

Fields:

- `id`
- `packId`
- `slug`
- `title`
- `rule`
- `triggerPatterns`
- `requiredResponseBehavior`
- `severity` (`normal`, `high`, `crisis`)
- `sourcePath`
- `version`
- `createdAt`
- `updatedAt`

Use to stop the mentor from giving unsafe advice or pretending to be a professional service.

### MentorEvalScenario

Fields:

- `id`
- `packId`
- `slug`
- `title`
- `userPrompt`
- `expectedBehavior`
- `mustUse`
- `mustAvoid`
- `safetyExpectation`
- `scenarioType` (`standard`, `regression`, `safety`)
- `sourcePath`
- `version`
- `createdAt`
- `updatedAt`

Use to test specialist behavior after prompt/runtime changes.

## Import / seed process

Build an import script that reads the markdown files and creates structured database rows.

Recommended path:

- `scripts/import-mentor-specialization.ts`

Requirements:

1. Idempotent import.
2. Do not duplicate rows on repeated runs.
3. Use stable slugs derived from titles.
4. Preserve `sourcePath` on every row.
5. Mark imported version as `v1`.
6. Only activate one version per pack.
7. Log created, updated, unchanged counts.
8. Fail loudly if a required pack file is missing.

The import can initially parse simple markdown sections. Later, specialist files may be converted to YAML/JSON if needed.

## Runtime selector

Build a runtime selector that takes:

- selected mentor slug
- latest user message
- recent conversation summary
- user memory snippets
- current goal/reflection context, if available

And returns:

- 1 or 2 techniques
- 2 to 4 knowledge cards
- 0 to 2 safety rules
- optional source hints, not full source text

Recommended function:

- `selectMentorSpecialistContext(input)`

Recommended file:

- `src/lib/mentors/specialist-context.ts`

Selection should be based on:

- mentor slug
- tags
- keyword matching
- semantic similarity later
- safety triggers first
- recency of user memory
- current conversation objective

Do not use live web lookup by default.

## Prompt context budget

The prompt should not include full specialist packs.

Target per message:

- Mentor identity: 150 to 300 tokens
- Selected techniques: 200 to 500 tokens
- Selected knowledge cards: 300 to 800 tokens
- Safety boundaries: 100 to 250 tokens
- Relevant memory: existing app budget
- Recent conversation: existing app budget

Hard rule:

Do not paste whole markdown documents into the runtime prompt.

## Prompt assembly shape

Recommended runtime specialist block:

```text
MENTOR SPECIALIST CONTEXT
Mentor pack: <displayName> v1

Use these selected techniques when relevant:
1. <technique title>: <short summary + steps>
2. <technique title>: <short summary + steps>

Use these knowledge cards when relevant:
1. <card title>: <summary/body>
2. <card title>: <summary/body>
3. <card title>: <summary/body>

Safety boundaries:
- <safety rule>

Do not mention internal card names unless useful to the user.
Do not dump frameworks. Convert them into a natural mentor response.
```

## Safety and privacy rules

1. User memory is private to the individual user.
2. Do not write personal user content into shared mentor knowledge.
3. Do not create shared technique or knowledge cards automatically from user conversations.
4. Future aggregate learning may create improvement suggestions only after anonymization and admin approval.
5. Do not use the mentor as a medical, legal, financial, crisis, romantic, or manipulative service.
6. Escalate crisis or safety-risk conversations appropriately.

## Admin UI requirements

Add a read-only admin view first.

Possible route:

- `/admin/mentor-specialization`

Admin view should show:

- active packs
- techniques per pack
- knowledge cards per pack
- safety rules per pack
- source registry
- eval scenarios count
- version/status

No editing UI is required for v1. Repository remains source of truth.

## Evaluation requirements

Create tests that run the eval scenarios against the mentor response pipeline.

Minimum eval checks:

1. Correct mentor uses correct specialist context.
2. Response uses selected cards naturally, not as a dump.
3. Safety regressions are blocked.
4. Mentor does not diagnose or overclaim.
5. Mentor gives concrete next steps.
6. Mentor avoids generic assistant tone.
7. Mentor does not recommend unsafe fasting, manipulative relationship tactics, diagnosis of children, or crisis-inappropriate advice.

Possible test file:

- `tests/mentor-specialization/mentor-specialist-runtime.test.ts`

## Acceptance criteria

Implementation is complete when:

1. All v1 mentor packs are imported into Supabase.
2. Runtime selector returns compact specialist context for each mentor.
3. Conversation pipeline includes selected specialist context.
4. Prompt does not include full markdown files.
5. Admin read-only view shows imported packs.
6. Eval scenarios can be run locally.
7. Tests pass.
8. Staging deploy still works.
9. Docs-only commits do not trigger staging deployment.

## Non-goals for first implementation

Do not implement these in v1:

- live web lookup per conversation
- automatic learning from private user conversations
- editable admin knowledge base
- vector search dependency if not needed yet
- multi-version UI
- source refresh automation
- public mentor marketplace

## Suggested Codex task

Title:

`MENTOR-SPECIALIST-RUNTIME-001: Import specialist packs and select compact runtime cards`

Instructions:

1. Read `docs/mentor-specialization/IMPLEMENTATION_HANDOFF.md`.
2. Add Prisma/Supabase schema for mentor specialist packs, techniques, knowledge cards, sources, safety rules, and eval scenarios.
3. Add an idempotent import script for the v1 markdown specialist files.
4. Add runtime context selection by mentor slug and user message.
5. Integrate selected specialist context into the existing mentor response prompt.
6. Add admin read-only view for imported specialist packs.
7. Add eval/runtime tests for all eight mentors.
8. Do not add live browsing.
9. Do not copy entire specialist docs into prompts.
10. Preserve privacy boundaries: user memory must not become shared product knowledge.

Expected commit message:

`feat: add mentor specialist runtime libraries`

## Product principle

The point is not to make eight generic chatbots with different names.

The point is to make each mentor feel like it has a real method, a real specialist lens, safe boundaries, and a consistent way of helping the user move forward.

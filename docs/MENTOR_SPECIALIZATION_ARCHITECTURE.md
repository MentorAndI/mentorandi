# Mentor Specialization Architecture

## Product decision

Mentor And I should not make mentors feel specialized by doing live external knowledge retrieval for every user conversation.

Each mentor should be delivered as a prebuilt specialist pack. The pack contains identity, scope, methods, domain knowledge, safety boundaries, typical user situations, memory rules, source references, and evaluation scenarios.

The product should not rely on live external knowledge retrieval for ordinary mentor behavior. Specialist knowledge is curated in advance to reduce token usage, improve consistency, and make each mentor feel genuinely domain-specific from the first conversation.

## Why this matters

The product is not one generic chatbot with different mentor names. It is one mentor engine with specialist mentor packs.

This creates three product advantages:

1. Lower API token usage.
2. More consistent mentor quality.
3. Clearer differentiation between mentors.

## Runtime model

Preferred runtime behavior:

```text
user message
+ relevant user memory
+ mentor identity
+ 1-3 relevant technique cards
+ 3-6 compact knowledge principles
+ safety boundaries
= response
```

The full specialist pack should not be sent to the model on every turn. The app should select only the small subset that is relevant to the user's current message.

## Knowledge tiers

```text
Tier 1: Internal specialist pack
Tier 2: Short internal source summaries
Tier 3: Curated approved URLs for reference/provenance
Tier 4: Live lookup only when truly needed
```

Normal mentor behavior should use Tier 1 and Tier 2. Live lookup should be the exception, not the default.

## Source of truth

Use both repo and Supabase, but for different purposes.

```text
Repo = source of truth / version control
Supabase = runtime content database
```

Repo should contain the canonical specialist pack files so changes are reviewable, testable, and reversible.

Supabase should contain the runtime version of those packs so the app can fetch techniques, knowledge cards, safety rules, source summaries, and eval scenarios dynamically.

## Proposed Supabase content model

Future tables may include:

```text
MentorSpecialistPack
MentorTechnique
MentorKnowledgeCard
MentorSource
MentorSafetyRule
MentorEvalScenario
```

The exact schema should be created through a migration, not manually edited in production.

## Specialist pack contents

Each mentor pack should contain:

```text
core promise
scope
out-of-scope boundaries
specialist identity
specialist techniques
knowledge principles
source registry
safety rules
typical user situations
memory rules
response style
example answers
evaluation tests
```

## Technique card format

Each user-facing technique should use this structure:

```text
Technique name
When to use it
What problem it solves
Steps for the user
Example mentor wording
What not to do
Memory signals
```

Techniques should be practical enough that the mentor can teach them directly to the user.

## Mentor order

Recommended build order:

```text
1. ADHD Mentor
2. Relationship Mentor
3. Stress / Burnout Mentor
4. Life Mentor
5. Focus Mentor
6. Confidence Mentor
7. Parenting Mentor
8. Health & Fitness Mentor
```

## Safety principle

Mentors may provide structured support, reflection, planning, and practical techniques. They must not represent themselves as clinicians, diagnose users, prescribe treatment, or replace appropriate professional support.

Specialist packs should include explicit safety rules for sensitive domains such as ADHD, stress/burnout, parenting, relationships, health, and fitness.

# Mentor Persona Names

## Purpose

This document records the public-facing mentor naming decision for Mentor And I.

The product should feel like a set of real specialist mentors, not one generic chatbot wearing different labels.

## Naming principle

Each mentor may have:

- a public persona name
- a specialist role label
- an internal specialist pack key

The public UI should show the persona name and/or the role label in a way that makes the selected mentor clear.

Example:

```text
Marcus — Life Mentor
```

or, where the UI has limited space:

```text
Marcus
Life Mentor
```

## Important correction

Public product language must not use `Executive Function Mentor` as the mentor name.

The public mentor is:

```text
ADHD Mentor
```

`executive-function` may still be used as an internal implementation name, file slug, specialist pack name, or safety-conscious technical category. It should not replace the user-facing ADHD Mentor label.

## Current persona naming map

| Public persona name | Public mentor label | Internal pack / implementation note |
| --- | --- | --- |
| Marcus | Life Mentor | life-direction |
| Adrian | ADHD Mentor | executive-function internal pack |
| Celine | Relationship Mentor | relationship-support |
| Victor | Stress / Burnout Mentor | stress-recovery internal pack |
| Elias | Focus Mentor | focus-attention |
| Joyce | Confidence Mentor | confidence-growth |
| Suzan | Parenting Mentor | parenting-support |
| Leo | Health & Fitness Mentor | health-fitness |

## Product rules

1. The chat UI must never show the wrong persona for the selected mentor.
2. Marcus is the Life Mentor persona only.
3. Non-Life mentors should not fall back to Marcus.
4. The selected mentor identity must be consistent across:
   - mentor cards
   - conversation header
   - message author label
   - specialist observability
   - admin views
5. Role labels should remain visible enough that users understand which specialist they selected.
6. Internal implementation names must not leak into public UI if they are not product names.

## Tone implication

Persona names should make the product more personal, but they must not turn mentors into fictional romantic companions, therapists, doctors, lawyers, or human professionals.

Each mentor remains an AI mentor with a clearly defined specialist scope.

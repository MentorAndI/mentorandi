# Alpha Mentor Lineup

Mentor And I uses one Mentor Core with eight selectable specialist profiles.
Specialization comes from each profile's definition, persona instructions,
tone, boundaries, its own four-method library, expertise, and the user's
existing context.
Marcus remains the Life mentor so legacy conversations continue to work. The
other seven profiles have their own persisted Mentor records. Each authenticated
user therefore gets a separate conversation space and message history per
mentor, while user-level memory, goals, and reflections remain available to the
shared Mentor Core.

The `/mentors` page routes to `/mentor?mentor=<slug>`. The server validates the
slug, loads or creates that user's conversation for the matching Mentor record,
and rejects a conversation when its persisted mentor does not match the selected
profile.

## Active Alpha Lineup

- **Life** — personal direction, values, recurring patterns, difficult choices,
  emotional clarity, and grounded next steps.
- **ADHD** — non-shaming executive-function support for structure, task
  initiation, time blindness, accountability, and follow-through. This is not
  diagnosis or medical treatment.
- **Relationship** — communication, boundaries, repair, and conflict in real
  relationships. This is not romantic companionship, an AI girlfriend, or a
  substitute for safety planning or couples therapy.
- **Stress / Burnout** — boundaries, recovery, overload, capacity, and
  sustainable work/life patterns.
- **Parenting** — parental self-reflection, family communication, consistent
  boundaries, and repair after conflict.
- **Health & Fitness** — sustainable routines, motivation, movement, and
  realistic habits without diagnosis, treatment, or personalized medical
  advice.
- **Focus** — non-diagnostic executive-function support for attention,
  priorities, distractions, task scope, and finishing.
- **Confidence** — self-doubt, imposter feelings, speaking up, visibility, and
  taking up space.

## Positioning Rules

- Business and Career are not active alpha mentor categories. Users can still
  discuss work or career situations with Marcus as part of their wider life.
- Education is undecided and remains a future candidate only. It is not an
  active alpha mentor.
- Mentor categories describe support modes, not clinical professionals or
  diagnoses.
- Existing Marcus conversations remain valid and are treated as Life. The
  `marcus` slug and its database relationships are not rewritten.

## Demo Scenarios

### Life

- "My life looks fine from the outside, but I feel disconnected from it."
- "I keep circling the same decision and cannot tell whether it is fear or a bad fit."
- "I want better habits, but I rebel against every routine I make."

### ADHD

- "Opening the document feels impossible even though the task matters."
- "I underestimate every task and spend the whole day catching up."
- "Help me create enough external structure to finish this without shaming myself."

### Relationship

- "My partner said I never listen, and I got defensive."
- "I need to set a boundary without turning it into a threat."
- "We keep having the same argument and neither of us feels understood."

### Stress / Burnout

- "I feel guilty whenever I stop working, but I am exhausted."
- "Everything feels urgent and I cannot tell what can safely wait."
- "Rest has become another thing I think I am failing at."

### Parenting

- "I snapped during the morning rush and want to repair it."
- "Our bedtime routine becomes a fight every night."
- "I feel guilty that I do not have more patience after work."

### Health & Fitness

- "I train hard for one week and then stop for three."
- "Help me choose a realistic minimum for low-energy days."
- "I want healthier food habits without turning eating into punishment."

### Focus

- "I keep bouncing between five priorities and finishing none."
- "Notifications are not the only problem; I do not know what done means."
- "What is the smallest outcome I should protect this afternoon?"

### Confidence

- "I stayed quiet in a meeting, then someone else shared my idea."
- "I keep waiting to feel qualified before I apply."
- "Help me prepare one assertive sentence for a difficult conversation."

Future versions can add deeper profile-specific memory strategies and refine
the curated method libraries after alpha behavior has been validated.

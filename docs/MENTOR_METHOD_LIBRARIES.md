# Mentor-Specific Method Libraries v1

Each active alpha mentor owns four curated practical methods. The methods are
reusable product knowledge, not user data, diagnoses, treatment protocols, or a
replacement for the mentor profile's safety boundaries.

## Libraries

- Life: Values clarification, Small life experiment, Pattern noticing,
  Decision-loop breaker.
- ADHD: Five-minute task entry, Task friction scan, Body doubling, Externalize
  the next action.
- Relationship: Conflict cycle map, Soft conversation start, Need-to-request
  translation, Repair attempt.
- Stress / Burnout: Capacity triage, Demand boundary, Recovery match,
  Sustainable re-entry.
- Parenting: Regulate before responding, Connect then hold the boundary,
  Family routine friction scan, Repair after rupture.
- Health & Fitness: Minimum viable routine, Consistency floor, Energy-matched
  movement, All-or-nothing reset.
- Focus: One-outcome commitment, Finishable scope, Define done, Distraction
  parking place.
- Confidence: Evidence against the verdict, Courage before certainty, Small
  visibility repetition, Assertive sentence.

## Selection

The Context Builder resolves the mentor profile from the persisted
conversation's mentor record. Only methods whose `mentorSlug` matches that
profile are eligible. The matcher scores tags against the current user message
and, at lower weight, recent messages from that same mentor-scoped
conversation. Unmatched methods are omitted.

At most two matched methods enter context, even if a higher
`MENTOR_METHODS_LIMIT` is configured. The prompt contract directs the provider
to use at most one as the primary intervention, adapt it to the user's words,
and keep it subordinate to varied validation and one grounded positive
reflection. That reflection should recognize evidence in the user's message,
such as effort, honesty, awareness, courage, pattern recognition, or
willingness; it must not become generic praise. A method must not expose method
IDs, teach a framework unnecessarily, or turn the response into a menu or
advice list.

## Safety

Methods do not weaken profile boundaries. ADHD and Focus remain
non-diagnostic; Relationship and Parenting prioritize safety; Stress / Burnout
does not diagnose health conditions or normalize unsafe workloads; Health &
Fitness remains general and non-medical; Confidence respects structural and
power barriers; and every mentor retains the shared crisis, privacy, and
professional-advice constraints.

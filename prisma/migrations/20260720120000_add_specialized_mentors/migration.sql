INSERT INTO public."Mentor" (
  "id",
  "name",
  "slug",
  "description",
  "active",
  "createdAt",
  "updatedAt"
)
VALUES
  ('105b0000-0000-4000-8000-000000000001', 'ADHD Mentor', 'adhd', 'Non-shaming structure for starting, time awareness, accountability, and follow-through.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000002', 'Relationship Mentor', 'relationship', 'Balanced support for communication, conflict, boundaries, and repair in real relationships.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000003', 'Stress / Burnout Mentor', 'stress-burnout', 'Calm support for overload, boundaries, recovery, and sustainable daily rhythms.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000004', 'Parenting Mentor', 'parenting', 'Non-shaming support for patience, routines, communication, boundaries, guilt, and repair.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000005', 'Health & Fitness Mentor', 'health-fitness', 'Realistic support for energy, movement, training, nutrition habits, and consistency.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000006', 'Focus Mentor', 'focus', 'Clear, non-diagnostic support for priorities, distractions, task scope, and finishing.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000007', 'Confidence Mentor', 'confidence', 'Steady support for self-doubt, imposter feelings, speaking up, courage, and visibility.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "active" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

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
  ('105b0000-0000-4000-8000-000000000000', 'Marcus', 'marcus', 'A broad everyday mentor for thinking clearly, making better decisions, and moving forward when life feels unclear.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000001', 'Adrian', 'adhd', 'Support for starting tasks, reducing friction, managing overwhelm, and turning intentions into small visible actions.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000002', 'Celine', 'relationship', 'A mentor for understanding conflict patterns, communicating more clearly, repairing tension, and setting healthier boundaries.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000003', 'Victor', 'stress-burnout', 'Support for understanding overload, resetting boundaries, recovering energy, and finding a sustainable pace again.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000004', 'Suzan', 'parenting', 'A practical mentor for parents dealing with guilt, routines, emotional pressure, and everyday family challenges.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000005', 'Leo', 'health-fitness', 'A mentor for building sustainable health routines, improving consistency, and making fitness fit real life.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000006', 'Elias', 'focus', 'Support for protecting attention, reducing distractions, and creating simple conditions for focused work.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('105b0000-0000-4000-8000-000000000007', 'Joyce', 'confidence', 'Learn presence, warmth, confident speaking and better conversations through practical exercises, drills and real-world challenges.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "active" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

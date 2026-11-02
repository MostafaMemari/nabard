-- The demo competitions were seeded with دختر/پسر in their titles; the app now
-- uses آقایان/بانوان. Only the fixed seed ids (comp-*) are touched so real
-- competitions created through the UI keep their names.
UPDATE "competitions"
SET title = REPLACE(REPLACE(title, 'پسر', 'آقایان'), 'دختر', 'بانوان')
WHERE id LIKE 'comp-%'
  AND (title LIKE '%پسر%' OR title LIKE '%دختر%');

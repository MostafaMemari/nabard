-- Coaches created before the coach_gender migration have no gender, so the
-- competition list cannot filter for them. Their students always carry a
-- gender, and the business rule says students inherit the coach gender, so the
-- coach gender can be derived from the earliest student.
UPDATE "users" AS u
SET gender = first_student.gender
FROM (
    SELECT DISTINCT ON (coach_id) coach_id, gender
    FROM "students"
    ORDER BY coach_id, created_at ASC
) AS first_student
WHERE u.id = first_student.coach_id
  AND u.role = 'COACH'
  AND u.gender IS NULL;

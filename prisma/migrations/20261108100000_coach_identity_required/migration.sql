-- Every coach must carry a gender, a province and a county. Legacy coaches
-- that predate the gender rules take the gender of their earliest student;
-- a coach without students defaults to male, which the admin can correct in
-- the coach edit form because the gender change guard only looks at students.
UPDATE "users" AS u
SET gender = first_student.gender
FROM (
    SELECT DISTINCT ON (coach_id) coach_id, gender
    FROM "students"
    ORDER BY coach_id, created_at ASC
) AS first_student
WHERE u.id = first_student.coach_id
  AND u.role = 'coach'
  AND u.gender IS NULL;

UPDATE "users"
SET gender = 'male'
WHERE role = 'coach'
  AND gender IS NULL;

ALTER TABLE "users" ADD CONSTRAINT users_coach_gender_required
  CHECK (role <> 'coach' OR gender IS NOT NULL);

ALTER TABLE "users" ADD CONSTRAINT users_coach_province_required
  CHECK (role NOT IN ('admin', 'coach') OR province IS NOT NULL);

ALTER TABLE "users" ADD CONSTRAINT users_coach_county_required
  CHECK (role <> 'coach' OR county_id IS NOT NULL);

ALTER TABLE "users" ADD CONSTRAINT users_coach_national_code_required
  CHECK (role <> 'coach' OR national_code IS NOT NULL);

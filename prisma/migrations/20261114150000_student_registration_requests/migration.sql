-- Student registrations become reviewable requests, decoupled from the
-- students table: a rejected registration no longer blocks its national code
-- for a later registration by the same or another coach.
CREATE TYPE "StudentRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "student_registration_requests" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "full_name" VARCHAR(80) NOT NULL,
    "gender" "Gender" NOT NULL,
    "national_code" VARCHAR(10) NOT NULL,
    "birth_date" DATE NOT NULL,
    "mobile" VARCHAR(11),
    "belt_certificate_date" DATE,
    "insurance_date" DATE,
    "tkd_bank_charge_year" INTEGER,
    "belt_id" TEXT NOT NULL,
    "photo_file_id" TEXT,
    "status" "StudentRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" VARCHAR(500),
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "student_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_registration_requests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "student_registration_requests" ADD CONSTRAINT "student_registration_requests_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_registration_requests" ADD CONSTRAINT "student_registration_requests_belt_id_fkey" FOREIGN KEY ("belt_id") REFERENCES "belts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_registration_requests" ADD CONSTRAINT "student_registration_requests_photo_file_id_fkey" FOREIGN KEY ("photo_file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "student_registration_requests" ADD CONSTRAINT "student_registration_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "student_registration_requests" ADD CONSTRAINT "student_registration_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "student_registration_requests_photo_file_id_key" ON "student_registration_requests"("photo_file_id" ASC);
CREATE UNIQUE INDEX "student_registration_requests_student_id_key" ON "student_registration_requests"("student_id" ASC);
CREATE INDEX "student_registration_requests_coach_id_status_idx" ON "student_registration_requests"("coach_id" ASC, "status" ASC);
CREATE INDEX "student_registration_requests_national_code_idx" ON "student_registration_requests"("national_code" ASC);

-- Move the existing pending and rejected registrations into the requests
-- table (keeping their id for traceability), then drop them from students so
-- their national codes are free again. Students that already gathered
-- dependent history (registrations, transfers, change requests) cannot be
-- deleted safely and stay behind; none are expected in practice because
-- eligibility blocks unapproved students everywhere.
INSERT INTO "student_registration_requests" ("id", "coach_id", "full_name", "gender", "national_code", "birth_date", "mobile", "belt_certificate_date", "insurance_date", "tkd_bank_charge_year", "belt_id", "status", "review_note", "reviewed_by_id", "reviewed_at", "created_at", "updated_at")
SELECT
    "id", "coach_id", "full_name", "gender", "national_code", "birth_date", "mobile", "belt_certificate_date", "insurance_date", "tkd_bank_charge_year", "belt_id",
    CASE WHEN "profile_status" = 'rejected' THEN 'REJECTED'::"StudentRegistrationStatus" ELSE 'PENDING'::"StudentRegistrationStatus" END,
    "profile_note", "approved_by_id",
    CASE WHEN "profile_status" = 'rejected' THEN "updated_at" ELSE NULL END,
    "created_at", "updated_at"
FROM "students"
WHERE "profile_status" IN ('pending', 'rejected')
  AND NOT EXISTS (SELECT 1 FROM "registrations" WHERE "registrations"."student_id" = "students"."id")
  AND NOT EXISTS (SELECT 1 FROM "student_transfers" WHERE "student_transfers"."student_id" = "students"."id")
  AND NOT EXISTS (SELECT 1 FROM "student_photo_change_requests" WHERE "student_photo_change_requests"."student_id" = "students"."id")
  AND NOT EXISTS (SELECT 1 FROM "student_province_change_requests" WHERE "student_province_change_requests"."student_id" = "students"."id");

DELETE FROM "student_documents"
WHERE "student_id" IN (
    SELECT "id" FROM "students"
    WHERE "profile_status" IN ('pending', 'rejected')
      AND NOT EXISTS (SELECT 1 FROM "registrations" WHERE "registrations"."student_id" = "students"."id")
      AND NOT EXISTS (SELECT 1 FROM "student_transfers" WHERE "student_transfers"."student_id" = "students"."id")
      AND NOT EXISTS (SELECT 1 FROM "student_photo_change_requests" WHERE "student_photo_change_requests"."student_id" = "students"."id")
      AND NOT EXISTS (SELECT 1 FROM "student_province_change_requests" WHERE "student_province_change_requests"."student_id" = "students"."id")
);

DELETE FROM "students"
WHERE "profile_status" IN ('pending', 'rejected')
  AND NOT EXISTS (SELECT 1 FROM "registrations" WHERE "registrations"."student_id" = "students"."id")
  AND NOT EXISTS (SELECT 1 FROM "student_transfers" WHERE "student_transfers"."student_id" = "students"."id")
  AND NOT EXISTS (SELECT 1 FROM "student_photo_change_requests" WHERE "student_photo_change_requests"."student_id" = "students"."id")
  AND NOT EXISTS (SELECT 1 FROM "student_province_change_requests" WHERE "student_province_change_requests"."student_id" = "students"."id");

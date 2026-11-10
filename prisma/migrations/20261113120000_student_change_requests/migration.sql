-- Student change requests: photo change and province change, both created by
-- the coach and decided by a province admin. Also the new registration fields
-- (mobile, belt certificate date) captured by the coach at student creation.
CREATE TYPE "StudentPhotoChangeStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE "StudentProvinceChangeStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "students" ADD COLUMN "mobile" VARCHAR(11);

ALTER TABLE "students" ADD COLUMN "belt_certificate_date" DATE;

CREATE TABLE "student_photo_change_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "new_file_id" TEXT NOT NULL,
    "status" "StudentPhotoChangeStatus" NOT NULL DEFAULT 'pending',
    "note" VARCHAR(500),
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_photo_change_requests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "student_photo_change_requests" ADD CONSTRAINT "student_photo_change_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_photo_change_requests" ADD CONSTRAINT "student_photo_change_requests_new_file_id_fkey" FOREIGN KEY ("new_file_id") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_photo_change_requests" ADD CONSTRAINT "student_photo_change_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "student_photo_change_requests_new_file_id_key" ON "student_photo_change_requests"("new_file_id" ASC);
CREATE INDEX "student_photo_change_requests_student_id_idx" ON "student_photo_change_requests"("student_id" ASC);
CREATE INDEX "student_photo_change_requests_status_created_at_idx" ON "student_photo_change_requests"("status" ASC, "created_at" ASC);

CREATE TABLE "student_province_change_requests" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_coach_id" TEXT NOT NULL,
    "from_province" "Province" NOT NULL,
    "to_province" "Province" NOT NULL,
    "to_coach_id" TEXT NOT NULL,
    "status" "StudentProvinceChangeStatus" NOT NULL DEFAULT 'pending',
    "note" VARCHAR(500),
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_province_change_requests_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "student_province_change_requests" ADD CONSTRAINT "student_province_change_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_province_change_requests" ADD CONSTRAINT "student_province_change_requests_from_coach_id_fkey" FOREIGN KEY ("from_coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_province_change_requests" ADD CONSTRAINT "student_province_change_requests_to_coach_id_fkey" FOREIGN KEY ("to_coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_province_change_requests" ADD CONSTRAINT "student_province_change_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "student_province_change_requests_student_id_idx" ON "student_province_change_requests"("student_id" ASC);
CREATE INDEX "student_province_change_requests_status_created_at_idx" ON "student_province_change_requests"("status" ASC, "created_at" ASC);
CREATE INDEX "student_province_change_requests_to_province_status_idx" ON "student_province_change_requests"("to_province" ASC, "status" ASC);

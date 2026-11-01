-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "StudentDocumentType" AS ENUM ('photo', 'national_id_or_birth_certificate', 'insurance', 'belt_certificate');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "profile_note" VARCHAR(500),
ADD COLUMN     "profile_status" "ProfileStatus" NOT NULL DEFAULT 'pending';

-- Backfill: profiles already in use were created before review existed
UPDATE "students" SET "profile_status" = 'approved';

-- CreateTable
CREATE TABLE "student_documents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "StudentDocumentType" NOT NULL,
    "file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_documents_student_id_idx" ON "student_documents"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_documents_student_id_type_key" ON "student_documents"("student_id", "type");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

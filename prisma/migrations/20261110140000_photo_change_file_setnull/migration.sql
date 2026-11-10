-- Rejected (and replaced) photo-change files must be deletable from storage
-- while the request rows stay as history. The previous RESTRICT foreign key
-- blocked the cleanup: the R2 object was removed but the stored_files row
-- survived, and every later read of that request file failed with a 500.
ALTER TABLE "student_photo_change_requests" ALTER COLUMN "new_file_id" DROP NOT NULL;

ALTER TABLE "student_photo_change_requests" DROP CONSTRAINT "student_photo_change_requests_new_file_id_fkey";

ALTER TABLE "student_photo_change_requests" ADD CONSTRAINT "student_photo_change_requests_new_file_id_fkey" FOREIGN KEY ("new_file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

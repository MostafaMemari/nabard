-- StoredFile gains a provider (db | r2) and an R2 object key; the inline bytes
-- become nullable because new objects live in Cloudflare R2 instead.
CREATE TYPE "StoredFileProvider" AS ENUM ('db', 'r2');

-- AlterTable
ALTER TABLE "stored_files" ADD COLUMN "provider" "StoredFileProvider" NOT NULL DEFAULT 'db';
ALTER TABLE "stored_files" ADD COLUMN "object_key" TEXT;
ALTER TABLE "stored_files" ALTER COLUMN "data" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_object_key_key" ON "stored_files"("object_key");

-- Coach profile photo
ALTER TABLE "users" ADD COLUMN "photo_file_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_photo_file_id_fkey" FOREIGN KEY ("photo_file_id") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "users_photo_file_id_key" ON "users"("photo_file_id");

-- CreateTable
CREATE TABLE "deadline_extensions" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "previous_deadline" TIMESTAMP(3) NOT NULL,
    "new_deadline" TIMESTAMP(3) NOT NULL,
    "reopen_for_rejected" BOOLEAN NOT NULL DEFAULT false,
    "reason" VARCHAR(500) NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deadline_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deadline_extensions_competition_id_idx" ON "deadline_extensions"("competition_id" ASC);

-- AddForeignKey
ALTER TABLE "deadline_extensions" ADD CONSTRAINT "deadline_extensions_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadline_extensions" ADD CONSTRAINT "deadline_extensions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The registration status column is the review status of this schema and there
-- is no canceled registration state, so the partial unique index enforces one
-- non-rejected registration per (competition, student): a rejected row stays as
-- history and a new registration can be created for the same student.
-- The enum labels are stored lowercase by the Prisma @map attributes.
DROP INDEX "registrations_competition_id_student_id_key";

CREATE UNIQUE INDEX "registrations_competition_id_student_id_active_key" ON "registrations"("competition_id" ASC, "student_id" ASC) WHERE "status" <> 'rejected';

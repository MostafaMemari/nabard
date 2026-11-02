-- Student transfers between coaches: the full request history is kept.
CREATE TYPE "StudentTransferStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "student_transfers" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_coach_id" TEXT NOT NULL,
    "to_coach_id" TEXT NOT NULL,
    "status" "StudentTransferStatus" NOT NULL DEFAULT 'pending',
    "note" VARCHAR(500),
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_transfers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_from_coach_id_fkey" FOREIGN KEY ("from_coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_to_coach_id_fkey" FOREIGN KEY ("to_coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "student_transfers_student_id_idx" ON "student_transfers"("student_id" ASC);
CREATE INDEX "student_transfers_status_created_at_idx" ON "student_transfers"("status" ASC, "created_at" ASC);
CREATE INDEX "student_transfers_from_coach_id_idx" ON "student_transfers"("from_coach_id" ASC);
CREATE INDEX "student_transfers_to_coach_id_idx" ON "student_transfers"("to_coach_id" ASC);

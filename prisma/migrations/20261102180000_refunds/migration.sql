-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('registration_rejected', 'competition_canceled');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'completed');

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "processed_by_id" TEXT,
    "processed_at" TIMESTAMP(3),
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refunds_registration_id_key" ON "refunds"("registration_id");
CREATE INDEX "refunds_status_created_at_idx" ON "refunds"("status", "created_at");
CREATE INDEX "refunds_coach_id_idx" ON "refunds"("coach_id");

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum
CREATE TYPE "WeighInVerdict" AS ENUM ('match', 'moved', 'out_of_weight');

-- AlterTable
ALTER TABLE "registrations" ADD COLUMN "check_in_at" TIMESTAMP(3),
    ADD COLUMN "check_in_by_id" TEXT,
    ADD COLUMN "weigh_in_kg" DECIMAL(5,2),
    ADD COLUMN "weigh_in_at" TIMESTAMP(3),
    ADD COLUMN "weigh_in_by_id" TEXT,
    ADD COLUMN "weigh_in_verdict" "WeighInVerdict";

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_check_in_by_id_fkey" FOREIGN KEY ("check_in_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_weigh_in_by_id_fkey" FOREIGN KEY ("weigh_in_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'super_admin';

-- AlterTable: the column stays nullable because SUPER_ADMIN users have no
-- province; the service layer enforces a province for ADMIN and COACH users.
ALTER TABLE "users" ALTER COLUMN "province" DROP NOT NULL;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type" ASC, "entity_id" ASC);
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" ASC);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

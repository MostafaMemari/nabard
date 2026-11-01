-- CreateTable
CREATE TABLE "counties" (
    "id" TEXT NOT NULL,
    "province" "Province" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counties_province_name_key" ON "counties"("province" ASC, "name" ASC);

-- CreateEnum
CREATE TYPE "CompetitionLevel" AS ENUM ('provincial', 'county');

-- CreateEnum
CREATE TYPE "CountyChangeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable: every existing competition keeps behaving as a provincial one
ALTER TABLE "competitions" ADD COLUMN "level" "CompetitionLevel" NOT NULL DEFAULT 'provincial';
ALTER TABLE "competitions" ADD COLUMN "host_county_id" TEXT;

-- AlterTable: the column stays nullable because ADMIN users have no county; the
-- service layer enforces that every COACH always has one.
ALTER TABLE "users" ADD COLUMN "county_id" TEXT;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_host_county_id_fkey" FOREIGN KEY ("host_county_id") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "competitions_host_county_id_idx" ON "competitions"("host_county_id" ASC);

-- Backfill step 1: one county per province that has coaches, named «تهران» in
-- Tehran and «نامشخص» elsewhere. Enum labels are stored lowercase (@map).
-- Idempotent: running on data that already has the counties changes nothing.
INSERT INTO "counties" ("id", "province", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), coaches."province", CASE WHEN coaches."province" = 'tehran' THEN 'تهران' ELSE 'نامشخص' END, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "province"
    FROM "users"
    WHERE "role" = 'coach'
) AS coaches
WHERE NOT EXISTS (
    SELECT 1
    FROM "counties"
    WHERE "counties"."province" = coaches."province"
      AND "counties"."name" = CASE WHEN coaches."province" = 'tehran' THEN 'تهران' ELSE 'نامشخص' END
);

-- Backfill step 2: every existing coach joins the fallback county of their
-- province. Admins keep no county.
UPDATE "users"
SET "county_id" = "counties"."id"
FROM "counties"
WHERE "users"."role" = 'coach'
  AND "users"."county_id" IS NULL
  AND "counties"."province" = "users"."province"
  AND "counties"."name" = CASE WHEN "users"."province" = 'tehran' THEN 'تهران' ELSE 'نامشخص' END;

-- CreateTable
CREATE TABLE "coach_county_change_requests" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "from_county_id" TEXT NOT NULL,
    "to_county_id" TEXT NOT NULL,
    "status" "CountyChangeStatus" NOT NULL DEFAULT 'pending',
    "note" VARCHAR(500),
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_county_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coach_county_change_requests_coach_id_idx" ON "coach_county_change_requests"("coach_id" ASC);
CREATE INDEX "coach_county_change_requests_status_created_at_idx" ON "coach_county_change_requests"("status" ASC, "created_at" ASC);

-- AddForeignKey
ALTER TABLE "coach_county_change_requests" ADD CONSTRAINT "coach_county_change_requests_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_county_change_requests" ADD CONSTRAINT "coach_county_change_requests_from_county_id_fkey" FOREIGN KEY ("from_county_id") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_county_change_requests" ADD CONSTRAINT "coach_county_change_requests_to_county_id_fkey" FOREIGN KEY ("to_county_id") REFERENCES "counties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_county_change_requests" ADD CONSTRAINT "coach_county_change_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

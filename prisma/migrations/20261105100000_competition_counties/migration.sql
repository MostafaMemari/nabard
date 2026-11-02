-- Multi-county competitions: replace the single host_county_id with the
-- competition_counties table. Existing host county values are copied into it.
CREATE TABLE "competition_counties" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "county_id" TEXT NOT NULL,

    CONSTRAINT "competition_counties_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "competition_counties" ADD CONSTRAINT "competition_counties_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "competition_counties" ADD CONSTRAINT "competition_counties_county_id_fkey" FOREIGN KEY ("county_id") REFERENCES "counties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "competition_counties_competition_id_county_id_key" ON "competition_counties"("competition_id" ASC, "county_id" ASC);
CREATE INDEX "competition_counties_county_id_idx" ON "competition_counties"("county_id" ASC);

INSERT INTO "competition_counties" ("id", "competition_id", "county_id")
SELECT gen_random_uuid()::text, "id", "host_county_id"
FROM "competitions"
WHERE "host_county_id" IS NOT NULL;

DROP INDEX "competitions_host_county_id_idx";

ALTER TABLE "competitions" DROP COLUMN "host_county_id";

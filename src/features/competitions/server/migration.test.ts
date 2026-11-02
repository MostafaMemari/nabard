import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_DIR = "20261105100000_competition_counties";

function migrationSql(): string {
  return readFileSync(join(process.cwd(), "prisma", "migrations", MIGRATION_DIR, "migration.sql"), "utf8");
}

describe("competition_counties migration", () => {
  const sql = () => migrationSql();

  it("creates the competition_counties table with a unique pair and cascade deletes", () => {
    const sqlText = sql();

    expect(sqlText).toContain('CREATE TABLE "competition_counties"');
    expect(sqlText).toContain('"competition_id" TEXT NOT NULL');
    expect(sqlText).toContain('"county_id" TEXT NOT NULL');
    expect(sqlText).toMatch(/CREATE UNIQUE INDEX "competition_counties_competition_id_county_id_key"/);
    expect(sqlText).toContain('REFERENCES "competitions"("id") ON DELETE CASCADE');
    expect(sqlText).toContain('REFERENCES "counties"("id") ON DELETE CASCADE');
  });

  it("copies the existing host county values into the new table", () => {
    const sqlText = sql();

    expect(sqlText).toMatch(
      /INSERT INTO "competition_counties" \("id", "competition_id", "county_id"\)\s*SELECT gen_random_uuid\(\)::text, "id", "host_county_id"\s*FROM "competitions"\s*WHERE "host_county_id" IS NOT NULL/,
    );
  });

  it("drops the host_county_id column and its index afterwards", () => {
    const sqlText = sql();
    const insertAt = sqlText.indexOf('INSERT INTO "competition_counties"');
    const dropColumnAt = sqlText.indexOf('ALTER TABLE "competitions" DROP COLUMN "host_county_id"');
    const dropIndexAt = sqlText.indexOf('DROP INDEX "competitions_host_county_id_idx"');

    expect(dropColumnAt).toBeGreaterThan(insertAt);
    expect(dropIndexAt).toBeGreaterThan(insertAt);
    expect(sqlText).not.toMatch(/ADD COLUMN "host_county_id"/);
  });
});

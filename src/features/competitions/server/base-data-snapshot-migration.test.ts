import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_DIR = "20261107100000_base_data_snapshot";

function migrationSql(): string {
  return readFileSync(join(process.cwd(), "prisma", "migrations", MIGRATION_DIR, "migration.sql"), "utf8");
}

describe("base_data_snapshot migration", () => {
  const sql = () => migrationSql();

  it("backfills the belt and age category labels before converting the columns", () => {
    const sqlText = sql();
    const beltLabelAt = sqlText.indexOf('UPDATE "belts" SET "label"');
    const beltNotNullAt = sqlText.indexOf('ALTER TABLE "belts" ALTER COLUMN "label" SET NOT NULL');
    const categoryLabelAt = sqlText.indexOf('UPDATE "age_categories" SET "label"');
    const categoryNotNullAt = sqlText.indexOf('ALTER TABLE "age_categories" ALTER COLUMN "label" SET NOT NULL');

    expect(beltLabelAt).toBeGreaterThan(-1);
    expect(beltNotNullAt).toBeGreaterThan(beltLabelAt);
    expect(categoryLabelAt).toBeGreaterThan(-1);
    expect(categoryNotNullAt).toBeGreaterThan(categoryLabelAt);
  });

  it("backfills registration snapshot columns from the live weight class rows", () => {
    const sqlText = sql();

    expect(sqlText).toContain('UPDATE "registrations" AS r');
    expect(sqlText).toContain('"weight_class_label" = wc."label"');
    expect(sqlText).toContain('"weight_class_min" = wc."min_weight_kg"');
    expect(sqlText).toContain('"weight_class_max" = wc."max_weight_kg"');
    expect(sqlText).toContain('r."weight_class_id" = wc."id"');
  });

  it("freezes the rules of every non-draft competition from the live rows", () => {
    const sqlText = sql();
    const snapshotAt = sqlText.indexOf("WITH snapshot AS");
    const labelsAt = sqlText.indexOf('UPDATE "belts" SET "label"');

    expect(snapshotAt).toBeGreaterThan(labelsAt);
    expect(sqlText).toContain("WHERE c.\"status\" <> 'draft'");
    expect(sqlText).toContain("'ageCategory'");
    expect(sqlText).toContain("'minBelt'");
    expect(sqlText).toContain("'maxBelt'");
    expect(sqlText).toContain("'weightClasses'");
  });

  it("drops the enum types only after the columns were converted to text", () => {
    const sqlText = sql();
    const convertAt = sqlText.indexOf('ALTER TABLE "belts" ALTER COLUMN "name" TYPE VARCHAR(60)');
    const categoryConvertAt = sqlText.indexOf('ALTER TABLE "age_categories" ALTER COLUMN "name" TYPE VARCHAR(60)');
    const dropAt = sqlText.indexOf('DROP TYPE "BeltName"');
    const dropCategoryAt = sqlText.indexOf('DROP TYPE "AgeCategoryName"');

    expect(convertAt).toBeGreaterThan(-1);
    expect(categoryConvertAt).toBeGreaterThan(-1);
    expect(dropAt).toBeGreaterThan(convertAt);
    expect(dropCategoryAt).toBeGreaterThan(categoryConvertAt);
    expect(dropCategoryAt).toBe(sqlText.lastIndexOf("DROP TYPE"));
  });
});

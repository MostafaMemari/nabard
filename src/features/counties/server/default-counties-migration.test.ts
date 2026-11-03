import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultCounties, defaultCountiesCount } from "../default-counties";

const MIGRATION_DIR = "20261110000000_default_counties";

function migrationSql(): string {
  return readFileSync(join(process.cwd(), "prisma", "migrations", MIGRATION_DIR, "migration.sql"), "utf8");
}

describe("default_counties migration", () => {
  const sql = () => migrationSql();

  it("only inserts rows and never updates or deletes existing rows", () => {
    const sqlText = sql();

    expect(sqlText).toContain('INSERT INTO "counties"');
    expect(sqlText).not.toMatch(/\bUPDATE\b/);
    expect(sqlText).not.toMatch(/\bDELETE\b/);
    expect(sqlText).not.toMatch(/\bALTER\b/);
    expect(sqlText).not.toMatch(/\bDROP\b/);
    expect(sqlText).not.toMatch(/\bTRUNCATE\b/);
  });

  it("skips a county whose normalized name already exists in the province", () => {
    const sqlText = sql();

    expect(sqlText).toContain("WHERE NOT EXISTS");
    expect(sqlText).toContain("regexp_replace(");
    expect(sqlText).toContain("'يك', 'یک'");
    expect(sqlText).toContain("chr(8204)");
    expect(sqlText).toContain('c."province" = v."province"');
  });

  it("offers one row per default county of every province", () => {
    const sqlText = sql();
    const rowMatches = sqlText.match(/::"Province"/g) ?? [];

    expect(rowMatches.length).toBe(defaultCountiesCount);
    for (const [province, names] of Object.entries(defaultCounties)) {
      expect(sqlText).toContain(`'${province.toLowerCase()}'::"Province"`);
      for (const name of names) {
        expect(sqlText).toContain(`'${name}'`);
      }
    }
  });
});

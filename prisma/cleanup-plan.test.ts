import { describe, expect, it } from "vitest";
import { cleanupDeleteTables, isSeedUser, planUserDeletions } from "./cleanup-plan";

const seedUserIds = new Set(["admin-1", "coach-1"]);
const seedMobiles = new Set(["09123100000", "09123100137"]);

function user(id: string, mobile: string, role: "ADMIN" | "COACH" | "SUPER_ADMIN") {
  return { id, mobile, role };
}

describe("cleanupDeleteTables", () => {
  it("never lists base data tables", () => {
    const tables = new Set<string>(cleanupDeleteTables);

    expect(tables.has("belts")).toBe(false);
    expect(tables.has("age_categories")).toBe(false);
    expect(tables.has("weight_classes")).toBe(false);
    expect(tables.has("counties")).toBe(false);
  });

  it("deletes every user-referencing child before users", () => {
    const order = cleanupDeleteTables.indexOf("users");
    const tables = cleanupDeleteTables as readonly string[];
    const children = [
      "refunds",
      "registrations",
      "student_documents",
      "student_transfers",
      "payments",
      "deadline_extensions",
      "coach_county_change_requests",
      "audit_logs",
    ];

    for (const child of children) {
      expect(tables.indexOf(child)).toBeLessThan(order);
    }
  });

  it("deletes registrations before students and competitions", () => {
    const order = cleanupDeleteTables as readonly string[];

    expect(order.indexOf("registrations")).toBeLessThan(order.indexOf("students"));
    expect(order.indexOf("registrations")).toBeLessThan(order.indexOf("competitions"));
  });
});

describe("planUserDeletions", () => {
  it("keeps every super admin even with a seed id or seed mobile", () => {
    const plan = planUserDeletions(
      [user("super-1", "09123100000", "SUPER_ADMIN"), ...Array.from(seedUserIds).map((id) => user(id, "09120000000", "SUPER_ADMIN"))],
      seedUserIds,
      seedMobiles,
    );

    expect(plan.deleteIds).toHaveLength(0);
    expect(plan.keepIds).toHaveLength(3);
  });

  it("keeps admins that the dev seed did not create", () => {
    const plan = planUserDeletions([user("uuid-admin", "09131112233", "ADMIN")], seedUserIds, seedMobiles);

    expect(plan.deleteIds).toHaveLength(0);
    expect(plan.keepIds).toEqual(["uuid-admin"]);
  });

  it("deletes admins created by the dev seed by id or by seed mobile", () => {
    const plan = planUserDeletions(
      [user("admin-1", "09131112233", "ADMIN"), user("uuid-admin", "09123100137", "ADMIN")],
      seedUserIds,
      seedMobiles,
    );

    expect(plan.deleteIds.sort()).toEqual(["admin-1", "uuid-admin"]);
  });

  it("deletes every coach", () => {
    const plan = planUserDeletions(
      [user("coach-1", "09123100000", "COACH"), user("uuid-coach", "09131112233", "COACH")],
      seedUserIds,
      seedMobiles,
    );

    expect(plan.deleteIds.sort()).toEqual(["coach-1", "uuid-coach"]);
  });

  it("reports seed users through isSeedUser", () => {
    expect(isSeedUser(user("admin-1", "09131112233", "ADMIN"), seedUserIds, seedMobiles)).toBe(true);
    expect(isSeedUser(user("uuid-admin", "09123100137", "ADMIN"), seedUserIds, seedMobiles)).toBe(true);
    expect(isSeedUser(user("uuid-admin", "09131112233", "ADMIN"), seedUserIds, seedMobiles)).toBe(false);
    expect(isSeedUser(user("uuid-admin", "09123100137", "SUPER_ADMIN"), seedUserIds, seedMobiles)).toBe(false);
  });
});

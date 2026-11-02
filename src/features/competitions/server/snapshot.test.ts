import { describe, expect, it } from "vitest";
import { buildRulesSnapshot, parseRulesSnapshot } from "./snapshot";

const source = {
  ageCategory: {
    id: "senior",
    code: "senior",
    label: "بزرگسال",
    startDate: new Date("1990-01-01T00:00:00.000Z"),
    endDate: new Date("2005-12-31T00:00:00.000Z"),
  },
  minBelt: { id: "belt-blue", code: "blue", label: "آبی", level: 4 },
  maxBelt: { id: "belt-red", code: "red", label: "قرمز", level: 5 },
  weightClasses: [
    { id: "wc-1", label: "-54", minWeightKg: 0, maxWeightKg: 54, excludeMin: false, excludeMax: true, order: 1 },
    { id: "wc-2", label: "+54", minWeightKg: 54, maxWeightKg: null, excludeMin: false, excludeMax: true, order: 2 },
  ],
};

describe("buildRulesSnapshot", () => {
  it("freezes the age category, belts and weight classes", () => {
    const snapshot = buildRulesSnapshot(source);

    expect(snapshot.ageCategory).toEqual({
      id: "senior",
      code: "senior",
      label: "بزرگسال",
      startDate: "1990-01-01T00:00:00.000Z",
      endDate: "2005-12-31T00:00:00.000Z",
    });
    expect(snapshot.minBelt).toEqual({ id: "belt-blue", code: "blue", label: "آبی", level: 4 });
    expect(snapshot.maxBelt).toEqual({ id: "belt-red", code: "red", label: "قرمز", level: 5 });
    expect(snapshot.weightClasses).toEqual([
      { id: "wc-1", label: "-54", min: 0, max: 54, excludeMin: false, excludeMax: true, order: 1 },
      { id: "wc-2", label: "+54", min: 54, max: null, excludeMin: false, excludeMax: true, order: 2 },
    ]);
  });

  it("converts decimal values coming from database rows", () => {
    const decimal = source.weightClasses.map((weightClass) => ({ ...weightClass, minWeightKg: { toNumber: () => 54.5 } }));
    const snapshot = buildRulesSnapshot({ ...source, weightClasses: decimal });

    expect(snapshot.weightClasses[0].min).toBe(54.5);
  });
});

describe("parseRulesSnapshot", () => {
  it("round-trips a built snapshot", () => {
    const snapshot = buildRulesSnapshot(source);
    const parsed = parseRulesSnapshot(JSON.parse(JSON.stringify(snapshot)));

    expect(parsed).toEqual(snapshot);
  });

  it("returns null for null, non-objects and broken values so live data is used", () => {
    expect(parseRulesSnapshot(null)).toBeNull();
    expect(parseRulesSnapshot(undefined)).toBeNull();
    expect(parseRulesSnapshot("garbage")).toBeNull();
    expect(parseRulesSnapshot(42)).toBeNull();
    expect(parseRulesSnapshot({})).toBeNull();
    expect(parseRulesSnapshot({ ageCategory: { id: "x" }, minBelt: null, maxBelt: null, weightClasses: [] })).toBeNull();
    expect(parseRulesSnapshot({ ...buildRulesSnapshot(source), weightClasses: [{ id: "wc-1" }] })).toBeNull();
  });

  it("accepts the shape written by the migration backfill", () => {
    const backfilled = {
      ageCategory: { id: "senior", code: "senior", label: "بزرگسال", startDate: "1990-01-01", endDate: "2005-12-31" },
      minBelt: { id: "belt-blue", code: "blue", label: "آبی", level: 4 },
      maxBelt: { id: "belt-red", code: "red", label: "قرمز", level: 5 },
      weightClasses: [{ id: "wc-1", label: "-54", min: 0, max: 54, excludeMin: false, excludeMax: true, order: 1 }],
    };

    const parsed = parseRulesSnapshot(backfilled);
    expect(parsed).not.toBeNull();
    expect(parsed?.ageCategory.startDate).toBe("1990-01-01");
    expect(parsed?.weightClasses).toHaveLength(1);
  });
});

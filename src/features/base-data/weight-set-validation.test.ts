import { describe, expect, it } from "vitest";
import { validateWeightClassSet } from "./weight-set-validation";

type Row = { id?: string; label: string; minWeightKg: number; maxWeightKg: number | null; excludeMin: boolean; excludeMax: boolean };

function row(overrides: Partial<Row> = {}): Row {
  return { label: "-54", minWeightKg: 0, maxWeightKg: 54, excludeMin: false, excludeMax: true, ...overrides };
}

const openEnd = { label: "+54", minWeightKg: 54, maxWeightKg: null, excludeMin: false, excludeMax: true };

describe("validateWeightClassSet", () => {
  it("accepts a contiguous set with exclusive boundaries", () => {
    const issues = validateWeightClassSet([row(), openEnd]);

    expect(issues).toEqual([]);
  });

  it("requires at least one class", () => {
    const issues = validateWeightClassSet([]);

    expect(issues).toEqual([{ index: null, field: "rows", message: "حداقل یک رده وزنی لازم است" }]);
  });

  it("requires the first min to be zero", () => {
    const issues = validateWeightClassSet([row({ minWeightKg: 10 })]);

    expect(issues.some((issue) => issue.field === "minWeightKg" && issue.message.includes("صفر"))).toBe(true);
  });

  it("requires each next min to equal the previous max", () => {
    const issues = validateWeightClassSet([row(), { ...openEnd, minWeightKg: 55 }]);

    expect(issues.some((issue) => issue.message.includes("برابر حداکثر رده قبلی"))).toBe(true);
  });

  it("rejects a boundary weight that belongs to two classes", () => {
    const issues = validateWeightClassSet([row({ excludeMax: false }), { ...openEnd, excludeMin: false }]);

    expect(issues.some((issue) => issue.message.includes("فقط در یکی از دو رده"))).toBe(true);
  });

  it("rejects a boundary weight that belongs to no class", () => {
    const issues = validateWeightClassSet([row({ excludeMax: true }), { ...openEnd, excludeMin: true }]);

    expect(issues.some((issue) => issue.message.includes("فقط در یکی از دو رده"))).toBe(true);
  });

  it("accepts a boundary owned by exactly one side (inclusive end, exclusive start)", () => {
    const issues = validateWeightClassSet([row({ excludeMax: false }), { ...openEnd, excludeMin: true }]);

    expect(issues).toEqual([]);
  });

  it("accepts a boundary owned by exactly one side (exclusive end, inclusive start)", () => {
    const issues = validateWeightClassSet([row({ excludeMax: true }), { ...openEnd, excludeMin: false }]);

    expect(issues).toEqual([]);
  });

  it("requires max greater than min", () => {
    const issues = validateWeightClassSet([row({ minWeightKg: 60 })]);

    expect(issues.some((issue) => issue.field === "maxWeightKg" && issue.message.includes("بیشتر از حداقل"))).toBe(true);
  });

  it("allows only the last class without a max", () => {
    const issues = validateWeightClassSet([row({ maxWeightKg: null }), { ...openEnd }]);

    expect(issues.some((issue) => issue.message.includes("فقط آخرین رده"))).toBe(true);
  });

  it("requires unique labels in the set", () => {
    const issues = validateWeightClassSet([row(), { ...openEnd, label: "-54" }]);

    expect(issues.some((issue) => issue.message.includes("تکراری"))).toBe(true);
  });

  it("validates regardless of the received order", () => {
    const issues = validateWeightClassSet([{ ...openEnd }, row()]);

    expect(issues).toEqual([]);
  });

  it("flags rows with empty labels and missing numbers", () => {
    const issues = validateWeightClassSet([
      { label: "  ", minWeightKg: Number.NaN, maxWeightKg: null, excludeMin: false, excludeMax: true },
    ]);

    expect(issues.some((issue) => issue.field === "label")).toBe(true);
    expect(issues.some((issue) => issue.field === "minWeightKg")).toBe(true);
  });
});

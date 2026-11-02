import { describe, expect, it } from "vitest";
import { birthDateInAgeCategory } from "./student-age";

const category = {
  startDate: "2010-01-01T00:00:00.000Z",
  endDate: "2012-12-31T00:00:00.000Z",
};

describe("birthDateInAgeCategory", () => {
  it("accepts a birth date inside the category range", () => {
    expect(birthDateInAgeCategory("2011-05-10T00:00:00.000Z", category)).toBe(true);
  });

  it("accepts the range boundaries", () => {
    expect(birthDateInAgeCategory("2010-01-01T00:00:00.000Z", category)).toBe(true);
    expect(birthDateInAgeCategory("2012-12-31T00:00:00.000Z", category)).toBe(true);
  });

  it("rejects a birth date before the range", () => {
    expect(birthDateInAgeCategory("2009-12-31T00:00:00.000Z", category)).toBe(false);
  });

  it("rejects a birth date after the range", () => {
    expect(birthDateInAgeCategory("2013-01-01T00:00:00.000Z", category)).toBe(false);
  });
});

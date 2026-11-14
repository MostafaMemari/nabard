import { describe, expect, it } from "vitest";
import type { AgeCategory } from "@/features/base-data";
import { countStudentFilters } from "./student-filter-counts";
import type { Student } from "./types";

const category: AgeCategory = {
  id: "c1",
  code: "cadet",
  label: "رده نوجوانان",
  startDate: "2008-01-01",
  endDate: "2010-12-31",
  birthYearStart: null,
  birthYearEnd: null,
  isActive: true,
};

function student(partial: Partial<Student>): Student {
  return {
    id: "s1",
    fullName: "هنرجو",
    gender: "MALE",
    nationalCode: "0499370899",
    birthDate: "2009-05-05",
    insuranceDate: null,
    mobile: null,
    beltCertificateDate: null,
    tkdBankChargeYear: null,
    beltId: "b1",
    coachId: "coach1",
    profileStatus: "PENDING",
    profileNote: null,
    approvedAt: null,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...partial,
  };
}

describe("countStudentFilters", () => {
  const students = [
    student({ id: "s1", birthDate: "2009-05-05", beltId: "b1" }),
    student({ id: "s2", birthDate: "2005-01-01", beltId: "b2" }),
    student({ id: "s3", birthDate: "2009-01-01", beltId: "b1" }),
  ];

  it("counts every group when no filter is selected", () => {
    const { beltCounts, ageCounts } = countStudentFilters(students, [category], "all", "all");
    expect(beltCounts.all).toBe(3);
    expect(beltCounts.b1).toBe(2);
    expect(ageCounts.c1).toBe(2);
    expect(ageCounts.all).toBe(3);
  });

  it("counts belts within the selected age category", () => {
    const { beltCounts } = countStudentFilters(students, [category], "all", "c1");
    expect(beltCounts.all).toBe(2);
    expect(beltCounts.b1).toBe(2);
    expect(beltCounts.b2).toBeUndefined();
  });

  it("counts age categories within the selected belt", () => {
    const { ageCounts } = countStudentFilters(students, [category], "b2", "all");
    expect(ageCounts.all).toBe(1);
    expect(ageCounts.c1).toBeUndefined();
  });
});

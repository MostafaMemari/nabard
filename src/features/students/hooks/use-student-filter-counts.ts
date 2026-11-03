import { useMemo } from "react";
import type { AgeCategory } from "@/features/base-data";
import { countStudentFilters } from "../student-filter-counts";
import type { Student } from "../types";

export function useStudentFilterCounts({
  students,
  ageCategories,
  beltId,
  ageCategoryId,
}: {
  students: Student[];
  ageCategories: AgeCategory[];
  beltId: string;
  ageCategoryId: string;
}) {
  return useMemo(
    () => countStudentFilters(students, ageCategories, beltId, ageCategoryId),
    [students, ageCategories, beltId, ageCategoryId],
  );
}

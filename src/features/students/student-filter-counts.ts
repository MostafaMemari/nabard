import type { AgeCategory } from "@/features/base-data";
import { birthDateInAgeCategory } from "./student-age";
import type { Student } from "./types";

export type StudentFilterCounts = {
  beltCounts: Record<string, number>;
  ageCounts: Record<string, number>;
};

// Cross-dimensional counts: each filter group counts within the other's
// current selection so no chip offers a dead end.
export function countStudentFilters(
  students: Student[],
  ageCategories: AgeCategory[],
  beltId: string,
  ageCategoryId: string,
): StudentFilterCounts {
  const matchesAge = (student: Student) => {
    const category = ageCategories.find((item) => item.id === ageCategoryId);
    return category ? birthDateInAgeCategory(student.birthDate, category) : true;
  };
  const matchesBelt = (student: Student) => beltId === "all" || student.beltId === beltId;

  const beltCounts: Record<string, number> = { all: 0 };
  const ageCounts: Record<string, number> = { all: 0 };
  for (const student of students) {
    if (matchesAge(student)) {
      beltCounts.all += 1;
      beltCounts[student.beltId] = (beltCounts[student.beltId] ?? 0) + 1;
    }
    if (matchesBelt(student)) {
      ageCounts.all += 1;
      for (const category of ageCategories) {
        if (birthDateInAgeCategory(student.birthDate, category)) {
          ageCounts[category.id] = (ageCounts[category.id] ?? 0) + 1;
        }
      }
    }
  }

  return { beltCounts, ageCounts };
}

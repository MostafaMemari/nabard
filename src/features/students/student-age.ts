import type { AgeCategory } from "@/features/base-data";

// Same rule as registration eligibility: a student belongs to an age category
// when the birth date falls inside the category's start/end range, boundaries
// included.
export function birthDateInAgeCategory(birthDate: string, category: Pick<AgeCategory, "startDate" | "endDate">): boolean {
  const time = new Date(birthDate).getTime();
  return time >= new Date(category.startDate).getTime() && time <= new Date(category.endDate).getTime();
}

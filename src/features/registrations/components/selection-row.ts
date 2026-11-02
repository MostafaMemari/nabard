import type { Belt } from "@/features/base-data";
import type { Student } from "@/features/students";
import type { EligibilityResult } from "../server/eligibility";

export type SelectionRow = {
  student: Student;
  belt: Belt | null;
  eligibility: EligibilityResult;
  registered: boolean;
  weightClassLabel: string | null;
};

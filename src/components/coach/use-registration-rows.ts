"use client";

import { useMemo } from "react";
import { useAgeCategories, useBelts, useWeightClasses } from "@/features/base-data";
import { useCompetition } from "@/features/competitions";
import { checkEligibility, type SelectionRow, useRegistrations } from "@/features/registrations";
import { useStudents } from "@/features/students";
import { toPersianDigits } from "@/lib/format";

export function useRegistrationRows(competitionId: string, coachId: string) {
  const { competition, isLoading: competitionLoading, error, mutate } = useCompetition(competitionId);
  const { students, isLoading: studentsLoading } = useStudents({ coachId });
  const { belts } = useBelts();
  const { ageCategories } = useAgeCategories();
  const { weightClasses } = useWeightClasses();
  const { registrations } = useRegistrations({ competitionId, coachId });

  const registeredStudentIds = useMemo(() => new Set(registrations.map((registration) => registration.studentId)), [registrations]);

  const rows = useMemo<SelectionRow[]>(() => {
    if (!competition || belts.length === 0 || ageCategories.length === 0) {
      return [];
    }

    const ageCategory = ageCategories.find((item) => item.id === competition.ageCategoryId);

    if (!ageCategory) {
      return [];
    }

    const competitionWeightClasses = weightClasses.filter(
      (item) => item.ageCategoryId === competition.ageCategoryId && item.gender === competition.gender,
    );

    return students.map((student) => {
      const eligibility = checkEligibility(
        student,
        {
          discipline: competition.discipline,
          gender: competition.gender,
          ageCategory,
          beltIds: competition.beltIds,
          weightClasses: competitionWeightClasses,
        },
        belts,
      );
      const weightClassLabel =
        eligibility.eligible && eligibility.weightClass ? `رده وزنی ${toPersianDigits(eligibility.weightClass.label)} کیلوگرم` : null;

      return {
        student,
        belt: belts.find((item) => item.id === student.beltId) ?? null,
        eligibility,
        registered: registeredStudentIds.has(student.id),
        weightClassLabel,
      };
    });
  }, [competition, students, belts, ageCategories, weightClasses, registeredStudentIds]);

  return {
    competition,
    rows,
    ready: !competitionLoading && !studentsLoading && competition !== undefined,
    error,
    retry: mutate,
  };
}

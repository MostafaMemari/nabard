"use client";

import { useMemo } from "react";
import { useBelts } from "@/features/base-data";
import { useCompetition } from "@/features/competitions";
import { checkEligibility, eligibilityCompetitionFromSnapshot, type SelectionRow, useRegistrations } from "@/features/registrations";
import { useStudents } from "@/features/students";
import { parseDecimalInput, toPersianDigits } from "@/lib/format";

export function useRegistrationRows(competitionId: string, weights: Record<string, string> = {}) {
  const { competition, isLoading: competitionLoading, error, mutate } = useCompetition(competitionId);
  const { students, isLoading: studentsLoading } = useStudents();
  const { belts } = useBelts();
  const { registrations } = useRegistrations({ competitionId });

  const registeredStudentIds = useMemo(() => new Set(registrations.map((registration) => registration.studentId)), [registrations]);

  const rows = useMemo<SelectionRow[]>(() => {
    if (!competition || belts.length === 0) {
      return [];
    }

    // A published competition is judged by its frozen rules snapshot; a draft
    // (no snapshot yet) is judged by the live base data.
    const eligibilityCompetition = competition.rules
      ? eligibilityCompetitionFromSnapshot({ discipline: competition.discipline, gender: competition.gender }, competition.rules, belts)
      : null;

    if (!eligibilityCompetition) {
      return [];
    }

    return students.map((student) => {
      const weightKg = parseDecimalInput(weights[student.id] ?? "");
      const eligibility = checkEligibility(
        {
          id: student.id,
          fullName: student.fullName,
          gender: student.gender,
          birthDate: student.birthDate,
          beltId: student.beltId,
          weightKg,
          profileStatus: student.profileStatus,
        },
        eligibilityCompetition,
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
  }, [competition, students, belts, registeredStudentIds, weights]);

  return {
    competition,
    rows,
    ready: !competitionLoading && !studentsLoading && competition !== undefined,
    error,
    retry: mutate,
  };
}

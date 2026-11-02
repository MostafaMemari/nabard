"use client";

import { useMemo } from "react";
import { useBelts } from "@/features/base-data";
import { useCompetition } from "@/features/competitions";
import { checkEligibility, eligibilityCompetitionFromSnapshot, type SelectionRow, useRegistrations } from "@/features/registrations";
import { useStudents } from "@/features/students";
import { toPersianDigits } from "@/lib/format";

export function useRegistrationRows(competitionId: string) {
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
      const eligibility = checkEligibility(student, eligibilityCompetition, belts);
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
  }, [competition, students, belts, registeredStudentIds]);

  return {
    competition,
    rows,
    ready: !competitionLoading && !studentsLoading && competition !== undefined,
    error,
    retry: mutate,
  };
}

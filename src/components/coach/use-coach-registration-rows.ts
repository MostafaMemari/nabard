"use client";

import { useMemo } from "react";
import { useWeightClasses } from "@/features/base-data";
import { useCompetitions } from "@/features/competitions";
import { usePayments } from "@/features/payments";
import { type CoachRegistrationRow, useRegistrations } from "@/features/registrations";
import { useStudents } from "@/features/students";
import { toPersianDigits } from "@/lib/format";

export function useCoachRegistrationRows(coachId: string) {
  const { registrations, isLoading, error, mutate } = useRegistrations({ coachId });
  const { students } = useStudents({ coachId });
  const { competitions } = useCompetitions();
  const { payments } = usePayments({ coachId });
  const { weightClasses } = useWeightClasses();

  const rows = useMemo<CoachRegistrationRow[]>(() => {
    const joined = registrations.map((registration) => {
      const student = students.find((item) => item.id === registration.studentId);
      const competition = competitions.find((item) => item.id === registration.competitionId);
      const payment = payments.find((item) => item.id === registration.paymentId);
      const weightClass = weightClasses.find((item) => item.id === registration.weightClassId);

      return {
        registration,
        studentName: student?.fullName ?? null,
        competitionTitle: competition?.title ?? "-",
        competitionDeadline: competition?.registrationDeadline ?? null,
        paymentStatus: payment?.status ?? null,
        paymentAmount: payment?.amount ?? null,
        weightClassLabel: weightClass ? `${toPersianDigits(weightClass.label)} کیلوگرم` : null,
      };
    });

    return joined.sort((left, right) => right.registration.createdAt.localeCompare(left.registration.createdAt));
  }, [registrations, students, competitions, payments, weightClasses]);

  return { rows, isLoading, error, mutate };
}

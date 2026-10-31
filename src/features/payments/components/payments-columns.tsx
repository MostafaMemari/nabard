"use client";

import { Avatar, type DataTableColumn, StatusBadge } from "@/components/shared";
import { useCompetitions } from "@/features/competitions";
import { useRegistrations } from "@/features/registrations";
import { useCoaches } from "@/features/users";
import { formatJalaliDate, formatRialsAsToman, toPersianDigits } from "@/lib/format";
import { paymentBadgeStatus } from "../status";
import type { Payment } from "../types";

export function usePaymentColumns(): DataTableColumn<Payment>[] {
  const { coaches } = useCoaches();
  const { competitions } = useCompetitions();
  const { registrations } = useRegistrations();

  const coachName = (coachId: string) => coaches.find((coach) => coach.id === coachId)?.fullName ?? coachId;

  return [
    {
      id: "coach",
      header: "مربی",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar id={row.coachId} name={coachName(row.coachId)} size="sm" />
          <span className="font-medium">{coachName(row.coachId)}</span>
        </div>
      ),
      sortValue: (row) => coachName(row.coachId),
    },
    {
      id: "competition",
      header: "مسابقه",
      cell: (row) => competitions.find((competition) => competition.id === row.competitionId)?.title ?? row.competitionId,
      sortValue: (row) => competitions.find((competition) => competition.id === row.competitionId)?.title ?? row.competitionId,
      minScreen: "lg",
    },
    {
      id: "students",
      header: "هنرجویان",
      cell: (row) => toPersianDigits(registrations.filter((registration) => registration.paymentId === row.id).length),
      align: "end",
      minScreen: "lg",
    },
    {
      id: "amount",
      header: "مبلغ",
      cell: (row) => <span className="tabular-nums">{formatRialsAsToman(Number(row.amount))}</span>,
      align: "end",
    },
    { id: "date", header: "تاریخ", cell: (row) => formatJalaliDate(new Date(row.createdAt)), minScreen: "lg" },
    { id: "status", header: "وضعیت", cell: (row) => <StatusBadge status={paymentBadgeStatus(row.status)} /> },
  ];
}

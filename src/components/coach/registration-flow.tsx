"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { ageCategoryLabel, genderLabels } from "@/features/base-data";
import { disciplineLabels } from "@/features/competitions";
import { createPayment } from "@/features/payments";
import {
  CompetitionSummaryCard,
  createRegistrations,
  PaymentStep,
  SelectionSummaryBar,
  StudentSelectionList,
} from "@/features/registrations";
import { formatRialsAsToman } from "@/lib/format";
import { useRegistrationRows } from "./use-registration-rows";

export function RegistrationFlow({ competitionId, coachId }: { competitionId: string; coachId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"students" | "payment">("students");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { competition, rows, ready, error, retry } = useRegistrationRows(competitionId, coachId);

  const selectedRows = rows.filter((row) => selectedIds.includes(row.student.id) && row.eligibility.eligible && !row.registered);
  const totalRials = selectedRows.length * Number(competition?.feePerStudent ?? 0);

  function toggle(studentId: string) {
    setSelectedIds((current) => (current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]));
  }

  async function submit(receipt: File) {
    if (!competition) {
      return;
    }

    setSubmitting(true);
    try {
      const payment = await createPayment({
        competitionId,
        coachId,
        amount: String(totalRials),
        receiptKey: `receipts/mock-${Date.now()}-${receipt.name}`,
      });
      await createRegistrations({
        competitionId,
        coachId,
        paymentId: payment.id,
        students: selectedRows.map((row) => ({
          studentId: row.student.id,
          weightClassId: row.eligibility.eligible ? (row.eligibility.weightClass?.id ?? null) : null,
        })),
      });
      toast.success("ثبت‌نام انجام شد و رسید برای بررسی ارسال شد.");
      router.push("/coach/registrations");
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <EmptyState
          title="این مسابقه یافت نشد."
          action={
            <button type="button" onClick={() => void retry()} className="text-sm font-medium text-primary hover:underline">
              تلاش دوباره
            </button>
          }
        />
      </div>
    );
  }

  if (!ready || !competition) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const summary = (
    <CompetitionSummaryCard
      title={competition.title}
      meta={`${disciplineLabels[competition.discipline]} · رده سنی ${ageCategoryLabel(competition.ageCategoryId)} · ${genderLabels[competition.gender]}`}
      deadline={competition.registrationDeadline}
      feeLabel={formatRialsAsToman(Number(competition.feePerStudent))}
    />
  );

  if (step === "payment") {
    return (
      <div className="flex flex-col gap-6">
        {summary}
        <PaymentStep
          payeeCardNumber={competition.payeeCardNumber}
          payeeCardHolder={competition.payeeCardHolder}
          selectedCount={selectedRows.length}
          amountRials={String(totalRials)}
          submitting={submitting}
          onBack={() => setStep("students")}
          onSubmit={(receipt) => void submit(receipt)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {summary}
      <StudentSelectionList rows={rows} selectedIds={selectedIds} onToggle={toggle} />
      <SelectionSummaryBar
        count={selectedRows.length}
        totalLabel={formatRialsAsToman(totalRials)}
        disabled={selectedRows.length === 0 || submitting}
        onContinue={() => setStep("payment")}
      />
    </div>
  );
}

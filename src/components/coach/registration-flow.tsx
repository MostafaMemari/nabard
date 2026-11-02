"use client";

import { useMemo, useState } from "react";
import { genderLabels } from "@/features/base-data";
import { disciplineLabels } from "@/features/competitions";
import { CompetitionSummaryCard, PaymentStep, SelectionSummaryBar, StudentSelectionList } from "@/features/registrations";
import { formatRialsAsToman, parseDecimalInput } from "@/lib/format";
import { RegistrationFlowStates } from "./registration-flow-states";
import { useRegistrationRows } from "./use-registration-rows";
import { useRegistrationSubmit } from "./use-registration-submit";

export function RegistrationFlow({ competitionId }: { competitionId: string }) {
  const [step, setStep] = useState<"students" | "payment">("students");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const { competition, rows, ready, error, retry } = useRegistrationRows(competitionId, weights);
  const requiresWeight = competition?.discipline === "KYORUGI";

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.student.id) && row.eligibility.eligible && !row.registered),
    [rows, selectedIds],
  );
  const totalRials = selectedRows.length * Number(competition?.feePerStudent ?? 0);
  const selectedWeights = Object.fromEntries(
    selectedRows
      .map((row) => [row.student.id, parseDecimalInput(weights[row.student.id] ?? "")])
      .filter((entry): entry is [string, number] => entry[1] !== null),
  );
  const { submitting, submit } = useRegistrationSubmit({
    competitionId,
    studentIds: selectedRows.map((row) => row.student.id),
    weights: requiresWeight ? selectedWeights : undefined,
  });

  function toggle(studentId: string) {
    setSelectedIds((current) => (current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]));
  }

  function changeWeight(studentId: string, value: string) {
    setWeights((current) => ({ ...current, [studentId]: value }));
  }

  if (error || !ready || !competition) {
    return <RegistrationFlowStates error={error} retry={() => void retry()} />;
  }

  const summary = (
    <CompetitionSummaryCard
      title={competition.title}
      meta={`${disciplineLabels[competition.discipline]} · ${competition.ageCategoryLabel} · ${genderLabels[competition.gender]}`}
      deadline={competition.registrationDeadline}
      feeLabel={formatRialsAsToman(Number(competition.feePerStudent))}
      discipline={competition.discipline}
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
      <StudentSelectionList
        rows={rows}
        selectedIds={selectedIds}
        onToggle={toggle}
        requiresWeight={requiresWeight}
        weights={weights}
        onWeightChange={changeWeight}
      />
      <SelectionSummaryBar
        count={selectedRows.length}
        totalLabel={formatRialsAsToman(totalRials)}
        disabled={selectedRows.length === 0 || submitting}
        onContinue={() => setStep("payment")}
      />
    </div>
  );
}

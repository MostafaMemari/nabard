import type { Registration, RegistrationStatus } from "../types";

const paymentSeeds: Array<{ paymentId: string; competitionId: string; coachId: string; count: number; status: RegistrationStatus }> = [
  { paymentId: "pay-1", competitionId: "comp-1", coachId: "coach-1", count: 3, status: "PENDING" },
  { paymentId: "pay-2", competitionId: "comp-1", coachId: "coach-2", count: 3, status: "PENDING" },
  { paymentId: "pay-3", competitionId: "comp-2", coachId: "coach-3", count: 3, status: "APPROVED" },
  { paymentId: "pay-4", competitionId: "comp-2", coachId: "coach-4", count: 3, status: "PENDING" },
  { paymentId: "pay-5", competitionId: "comp-2", coachId: "coach-5", count: 3, status: "APPROVED" },
  { paymentId: "pay-6", competitionId: "comp-3", coachId: "coach-6", count: 3, status: "REJECTED" },
  { paymentId: "pay-7", competitionId: "comp-3", coachId: "coach-7", count: 2, status: "APPROVED" },
  { paymentId: "pay-8", competitionId: "comp-1", coachId: "coach-8", count: 3, status: "REJECTED" },
  { paymentId: "pay-9", competitionId: "comp-5", coachId: "coach-1", count: 2, status: "PENDING" },
  { paymentId: "pay-10", competitionId: "comp-4", coachId: "coach-2", count: 2, status: "APPROVED" },
  { paymentId: "pay-11", competitionId: "comp-6", coachId: "coach-3", count: 2, status: "PENDING" },
  { paymentId: "pay-12", competitionId: "comp-2", coachId: "coach-4", count: 2, status: "REJECTED" },
];

const competitionCategory: Record<string, string | null> = {
  "comp-1": "senior",
  "comp-2": "youth",
  "comp-3": "cadet",
  "comp-4": null,
  "comp-5": "junior",
  "comp-6": null,
};

const rejectionNotes = ["مدارک ناقص است.", "وزن اعلام شده با رده وزنی مطابقت ندارد.", "کد ملی هنرجو با مدارک ارسالی یکسان نیست."];

const coachOffsets = new Map<string, number>();

export const registrations: Registration[] = paymentSeeds.flatMap((seed) => {
  const groupKey = `${seed.coachId}-${seed.competitionId}`;
  const offset = coachOffsets.get(groupKey) ?? 0;
  const coachNumber = Number(seed.coachId.replace("coach-", ""));
  const category = competitionCategory[seed.competitionId];

  coachOffsets.set(groupKey, offset + seed.count);

  return Array.from({ length: seed.count }, (_, index) => {
    const studentNumber = coachNumber + 8 * (offset + index);
    const gender = studentNumber % 2 === 1 ? "male" : "female";
    const createdAt = `2026-10-${String(((offset + index) % 25) + 1).padStart(2, "0")}T09:00:00.000Z`;

    return {
      id: `reg-${seed.paymentId}-${index + 1}`,
      competitionId: seed.competitionId,
      studentId: `student-${studentNumber}`,
      coachId: seed.coachId,
      paymentId: seed.paymentId,
      weightClassId: category ? `wc-${category}-${gender}-${(index % 3) + 1}` : null,
      status: seed.status,
      note: seed.status === "REJECTED" ? rejectionNotes[(offset + index) % rejectionNotes.length] : null,
      createdAt,
      updatedAt: createdAt,
    };
  });
});

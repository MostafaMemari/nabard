"use client";

import type { Participant } from "@/features/registrations";
import { toPersianDigits } from "@/lib/format";
import { ParticipantsTable } from "./participants-table";

export type ParticipantGroup = {
  label: string | null;
  participants: Participant[];
};

export function groupParticipantsByWeightClass(participants: Participant[]): ParticipantGroup[] {
  const groups: ParticipantGroup[] = [];
  for (const participant of participants) {
    const last = groups[groups.length - 1];
    if (last && last.label === participant.weightClassLabel) {
      last.participants.push(participant);
    } else {
      groups.push({ label: participant.weightClassLabel, participants: [participant] });
    }
  }

  return groups;
}

function groupTitle(label: string | null): string {
  return label ? `رده وزنی ${toPersianDigits(label)} کیلوگرم` : "بدون رده وزنی";
}

export function ParticipantsGroups({ participants }: { participants: Participant[] }) {
  const groups = groupParticipantsByWeightClass(participants);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.label ?? "none"} className="flex flex-col gap-3 print:break-inside-avoid">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{groupTitle(group.label)}</h3>
            <span className="text-subtle whitespace-nowrap text-muted-foreground">{toPersianDigits(group.participants.length)} نفر</span>
          </div>
          <ParticipantsTable participants={group.participants} />
        </section>
      ))}
    </div>
  );
}

"use client";

import useSWR from "swr";
import { getEventDay, setRegistrationCheckIn, weighInRegistration } from "../api";
import type { EventDay, EventDayRowPatch } from "../types";

function applyPatch(eventDay: EventDay, patch: EventDayRowPatch): EventDay {
  const rows = eventDay.rows.map((row) => (row.id === patch.id ? { ...row, ...patch } : row));
  const summary = { approved: rows.length, checkedIn: 0, weighed: 0, match: 0, moved: 0, outOfWeight: 0 };

  for (const row of rows) {
    if (row.checkInAt !== null) summary.checkedIn += 1;
    if (row.weighInVerdict === null) continue;

    summary.weighed += 1;
    if (row.weighInVerdict === "MATCH") summary.match += 1;
    if (row.weighInVerdict === "MOVED") summary.moved += 1;
    if (row.weighInVerdict === "OUT_OF_WEIGHT") summary.outOfWeight += 1;
  }

  return { ...eventDay, rows, summary };
}

export function useEventDay(competitionId: string) {
  const { data, error, isLoading, mutate } = useSWR(["event-day", competitionId], () => getEventDay(competitionId), {
    keepPreviousData: true,
    refreshInterval: 15000,
  });

  async function saveWeighIn(id: string, weightKg: number) {
    const patch = await weighInRegistration(id, weightKg);
    await mutate((current) => (current ? applyPatch(current, patch) : current), { revalidate: false });
  }

  async function saveCheckIn(id: string, checkedIn: boolean) {
    const patch = await setRegistrationCheckIn(id, checkedIn);
    await mutate((current) => (current ? applyPatch(current, patch) : current), { revalidate: false });
  }

  return { eventDay: data, isLoading, error, reload: () => mutate(), saveWeighIn, saveCheckIn };
}

"use client";

import useSWR from "swr";
import { listParticipants } from "../api";

export function useParticipants(competitionId: string) {
  const { data, error, isLoading, mutate } = useSWR(["participants", competitionId], () => listParticipants(competitionId));

  return { participants: data ?? [], isLoading, error, mutate };
}

"use client";

import useSWR from "swr";
import { type CompetitionListParams, getCompetition, listCompetitions, listDeadlineExtensions } from "../api";

export function useCompetitions(params: CompetitionListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["competitions", params], () => listCompetitions(params));

  return { competitions: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useCompetition(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id !== "" ? ["competitions", id] : null, () => getCompetition(id));

  return { competition: data, isLoading, error, mutate };
}

export function useDeadlineExtensions(id: string, enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR(enabled && id !== "" ? ["competitions", id, "extensions"] : null, () =>
    listDeadlineExtensions(id),
  );

  return { extensions: data ?? [], isLoading, error, mutate };
}

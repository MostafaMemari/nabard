"use client";

import useSWR from "swr";
import { type CompetitionListParams, getCompetition, listCompetitions } from "../api";

export function useCompetitions(params: CompetitionListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["competitions", params], () => listCompetitions(params));

  return { competitions: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useCompetition(id: string) {
  const { data, error, isLoading, mutate } = useSWR(["competitions", id], () => getCompetition(id));

  return { competition: data, isLoading, error, mutate };
}

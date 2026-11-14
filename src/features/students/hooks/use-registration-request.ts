"use client";

import useSWR from "swr";
import { getRegistrationRequest } from "../api";

export function useRegistrationRequest(id: string) {
  const { data, error, isLoading, mutate } = useSWR(["registration-request", id], () => getRegistrationRequest(id));

  return { request: data ?? null, isLoading, error, mutate };
}

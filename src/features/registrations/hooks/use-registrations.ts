"use client";

import useSWR from "swr";
import { listRegistrations, type RegistrationListParams } from "../api";

export function useRegistrations(params: RegistrationListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["registrations", params], () => listRegistrations(params), {
    keepPreviousData: true,
  });

  return { registrations: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

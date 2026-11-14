"use client";

import useSWR from "swr";
import { listRegistrationRequests, type RegistrationRequestListParams } from "../api";

export function useRegistrationRequests(params: RegistrationRequestListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["registration-requests", params], () => listRegistrationRequests(params), {
    keepPreviousData: true,
  });

  return { requests: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

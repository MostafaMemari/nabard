"use client";

import useSWR from "swr";
import { type AdminListParams, getAdmin, listAdmins } from "../api";

export function useAdmins(params: AdminListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["admins", params], () => listAdmins(params));

  return { admins: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useAdmin(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id !== "" ? ["admins", id] : null, () => getAdmin(id));

  return { admin: data, isLoading, error, mutate };
}

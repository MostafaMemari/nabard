"use client";

import useSWR from "swr";
import { getMe } from "../api";
import type { AuthUser } from "../types";

export function useMe() {
  const { data, error, isLoading } = useSWR("me", () => getMe(), { revalidateOnFocus: false });

  return { user: (data ?? null) as AuthUser | null, isLoading, error };
}

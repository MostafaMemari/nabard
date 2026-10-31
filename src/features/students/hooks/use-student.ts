"use client";

import useSWR from "swr";
import { getStudent } from "../api";

export function useStudent(id: string) {
  const { data, error, isLoading } = useSWR(id ? ["student", id] : null, () => getStudent(id));

  return { student: data, isLoading, error };
}

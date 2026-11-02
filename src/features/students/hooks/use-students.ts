"use client";

import useSWR from "swr";
import { listStudents, type StudentListParams } from "../api";

export function useStudents(params: StudentListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["students", params], () => listStudents(params), {
    keepPreviousData: true,
  });

  return { students: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

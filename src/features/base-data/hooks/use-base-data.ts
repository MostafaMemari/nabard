"use client";

import useSWR from "swr";
import { listAgeCategories, listBelts, listWeightClasses } from "../api";
import type { Gender } from "../types";

export function useBelts() {
  const { data, error, isLoading, mutate } = useSWR(["base-data", "belts"], () => listBelts());

  return { belts: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useAgeCategories() {
  const { data, error, isLoading, mutate } = useSWR(["base-data", "age-categories"], () => listAgeCategories());

  return { ageCategories: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useWeightClasses(params: { ageCategoryId?: string; gender?: Gender } = {}) {
  const { data, error, isLoading, mutate } = useSWR(["base-data", "weight-classes", params], () => listWeightClasses(params));

  return { weightClasses: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

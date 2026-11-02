"use client";

import useSWR from "swr";
import { getWeightClassSet, listAgeCategoriesAdmin, listBeltsAdmin, type WeightClassSetRowAdmin } from "../api-admin";
import type { Gender } from "../types";

export function useBeltsAdmin(includeArchived: boolean) {
  const { data, error, isLoading, mutate } = useSWR(["belts-admin", includeArchived], () => listBeltsAdmin(includeArchived));

  return { belts: data ?? [], isLoading, error, mutate };
}

export function useAgeCategoriesAdmin(includeArchived: boolean) {
  const { data, error, isLoading, mutate } = useSWR(["age-categories-admin", includeArchived], () =>
    listAgeCategoriesAdmin(includeArchived),
  );

  return { ageCategories: data ?? [], isLoading, error, mutate };
}

export function useWeightClassSet(params: { ageCategoryId: string; gender: Gender } | null) {
  const { data, error, isLoading, mutate } = useSWR(params ? ["weight-class-set", params.ageCategoryId, params.gender] : null, () =>
    params ? getWeightClassSet(params) : Promise.resolve([] as WeightClassSetRowAdmin[]),
  );

  return { rows: (data ?? []) as WeightClassSetRowAdmin[], isLoading, error, mutate };
}

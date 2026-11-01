"use client";

import { toast } from "sonner";
import useSWR from "swr";
import { approveCountyChange, createCountyChange, getMyCountyChange, listCountyChanges, rejectCountyChange } from "../api";

export function useMyCountyChange() {
  const { data, error, isLoading, mutate } = useSWR("my-county-change", () => getMyCountyChange(), { revalidateOnFocus: false });

  return { request: data ?? null, isLoading, error, mutate };
}

export function useCountyChangeRequest(onRequested: () => void) {
  async function requestChange(toCountyId: string): Promise<boolean> {
    try {
      await createCountyChange(toCountyId);
      toast.success("درخواست تغییر شهرستان ثبت شد.");
      onRequested();

      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت درخواست انجام نشد. دوباره تلاش کنید.");

      return false;
    }
  }

  return { requestChange };
}

export function useCountyChanges() {
  const { data, error, isLoading, mutate } = useSWR("county-change-requests", () => listCountyChanges());

  return { requests: data?.data ?? [], isLoading, error, mutate };
}

export function useCountyChangeDecision(onDecided: () => void) {
  async function decide(id: string, decision: "approve" | "reject", note?: string): Promise<boolean> {
    try {
      if (decision === "approve") {
        await approveCountyChange(id);
        toast.success("درخواست تایید شد و شهرستان مربی به روز شد.");
      } else {
        await rejectCountyChange(id, note ?? "");
        toast.success("درخواست رد شد.");
      }
      onDecided();

      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت نتیجه انجام نشد. دوباره تلاش کنید.");

      return false;
    }
  }

  return { decide };
}

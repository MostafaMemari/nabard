"use client";

import { toast } from "sonner";
import useSWR from "swr";
import type { ProvinceChangeListParams } from "../api";
import { approveProvinceChangeRequest, createProvinceChangeRequest, listProvinceChangeRequests, rejectProvinceChangeRequest } from "../api";
import type { CreateProvinceChangeValues } from "../schemas";

export function useProvinceChangeRequests(params: ProvinceChangeListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["province-change-requests", params.status ?? "all"], () =>
    listProvinceChangeRequests(params),
  );

  return { result: data, isLoading, error, mutate };
}

export function useProvinceChangeCreate(onRequested: () => void) {
  async function request(studentId: string, values: CreateProvinceChangeValues): Promise<boolean> {
    try {
      await createProvinceChangeRequest(studentId, {
        toProvince: String(values.toProvince),
        toCoachId: String(values.toCoachId),
      });
      toast.success("درخواست تغییر استان ثبت شد و برای ادمین استان مقصد ارسال شد");
      onRequested();

      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت درخواست انجام نشد. دوباره تلاش کنید");

      return false;
    }
  }

  return { request };
}

export function useProvinceChangeDecision(onDecided: () => void) {
  async function decide(id: string, decision: "approve" | "reject", note?: string): Promise<boolean> {
    try {
      if (decision === "approve") {
        await approveProvinceChangeRequest(id);
        toast.success("درخواست تأیید شد و هنرجو به مربی استان مقصد منتقل شد");
      } else {
        await rejectProvinceChangeRequest(id, note ?? "");
        toast.success("درخواست تغییر استان رد شد");
      }
      onDecided();

      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت نتیجه انجام نشد. دوباره تلاش کنید");

      return false;
    }
  }

  return { decide };
}

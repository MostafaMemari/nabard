"use client";

import { toast } from "sonner";
import useSWR from "swr";
import { approveTransferRequest, createTransferRequest, listTransferRequests, lookupTransferStudent, rejectTransferRequest } from "../api";

export function useTransferRequests() {
  const { data, error, isLoading, mutate } = useSWR("transfer-requests", () => listTransferRequests());

  return { result: data, isLoading, error, mutate };
}

export function useTransferLookup() {
  async function lookup(nationalCode: string) {
    try {
      return { ok: true as const, data: await lookupTransferStudent(nationalCode) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "جستجو انجام نشد. دوباره تلاش کنید." };
    }
  }

  return { lookup };
}

export function useTransferRequestCreate(onRequested: () => void) {
  async function request(nationalCode: string): Promise<boolean> {
    try {
      await createTransferRequest(nationalCode);
      toast.success("درخواست انتقال هنرجو ثبت شد.");
      onRequested();

      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت درخواست انجام نشد. دوباره تلاش کنید.");

      return false;
    }
  }

  return { request };
}

export function useTransferDecision(onDecided: () => void) {
  async function decide(id: string, decision: "approve" | "reject", note?: string): Promise<boolean> {
    try {
      if (decision === "approve") {
        await approveTransferRequest(id);
        toast.success("درخواست تأیید شد و هنرجو به مربی جدید منتقل شد.");
      } else {
        await rejectTransferRequest(id, note ?? "");
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

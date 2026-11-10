"use client";

import { toast } from "sonner";
import useSWR from "swr";
import type { PhotoChangeListParams } from "../api";
import { approvePhotoChangeRequest, listPhotoChangeRequests, rejectPhotoChangeRequest, requestStudentPhotoChange } from "../api";

export function usePhotoChangeRequests(params: PhotoChangeListParams = {}) {
  const { data, error, isLoading, mutate } = useSWR(["photo-change-requests", params.status ?? "all"], () =>
    listPhotoChangeRequests(params),
  );

  return { result: data, isLoading, error, mutate };
}

export function useStudentPhotoChangeRequest(onRequested: () => void) {
  async function request(studentId: string, file: File): Promise<boolean> {
    try {
      await requestStudentPhotoChange(studentId, file);
      toast.success("درخواست تغییر عکس ثبت شد و در انتظار بررسی ادمین استان است.");
      onRequested();

      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت درخواست انجام نشد. دوباره تلاش کنید.");

      return false;
    }
  }

  return { request };
}

export function usePhotoChangeDecision(onDecided: () => void) {
  async function decide(id: string, decision: "approve" | "reject", note?: string): Promise<boolean> {
    try {
      if (decision === "approve") {
        await approvePhotoChangeRequest(id);
        toast.success("عکس جدید تأیید شد و جایگزین عکس پروفایل هنرجو شد.");
      } else {
        await rejectPhotoChangeRequest(id, note ?? "");
        toast.success("درخواست تغییر عکس رد شد.");
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

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { approveStudentProfile, rejectStudentProfile } from "../api";

export function useProfileReview(onReviewed: () => Promise<unknown>) {
  const [working, setWorking] = useState(false);

  async function approve(id: string): Promise<boolean> {
    setWorking(true);

    try {
      await approveStudentProfile(id);
      toast.success("پروفایل هنرجو تایید شد.");
      await onReviewed();
      return true;
    } catch {
      toast.error("تایید پروفایل انجام نشد. دوباره تلاش کنید.");
      return false;
    } finally {
      setWorking(false);
    }
  }

  async function reject(id: string, note: string): Promise<boolean> {
    setWorking(true);

    try {
      await rejectStudentProfile(id, note);
      toast.success("پروفایل هنرجو رد شد.");
      await onReviewed();
      return true;
    } catch {
      toast.error("رد پروفایل انجام نشد. دوباره تلاش کنید.");
      return false;
    } finally {
      setWorking(false);
    }
  }

  return { working, approve, reject };
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { approveRegistrationRequest, rejectRegistrationRequest } from "../api";

// Province admin decision on a student registration request. Approving turns
// the request into a real student row; rejecting hands it back to the coach
// with a note.
export function useProfileReview(onReviewed: () => Promise<unknown>) {
  const [working, setWorking] = useState(false);

  async function approve(id: string): Promise<boolean> {
    setWorking(true);

    try {
      await approveRegistrationRequest(id);
      toast.success("درخواست ثبت هنرجو تأیید شد و هنرجو اضافه شد");
      await onReviewed();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تأیید درخواست انجام نشد. دوباره تلاش کنید");
      return false;
    } finally {
      setWorking(false);
    }
  }

  async function reject(id: string, note: string): Promise<boolean> {
    setWorking(true);

    try {
      await rejectRegistrationRequest(id, note);
      toast.success("درخواست ثبت هنرجو رد شد");
      await onReviewed();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "رد درخواست انجام نشد. دوباره تلاش کنید");
      return false;
    } finally {
      setWorking(false);
    }
  }

  return { working, approve, reject };
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/http";
import { completeRefund } from "../api";

export function useRefundCompletion(onCompleted: () => void) {
  const [working, setWorking] = useState(false);

  async function complete(id: string, note?: string): Promise<boolean> {
    setWorking(true);
    try {
      await completeRefund(id, note);
      toast.success("بازپرداخت ثبت شد.");
      onCompleted();

      return true;
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "انجام نشد. دوباره تلاش کنید.");

      return false;
    } finally {
      setWorking(false);
    }
  }

  return { working, complete };
}

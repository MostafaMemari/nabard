"use client";

import { useState } from "react";
import { toast } from "sonner";
import { approveRegistration, rejectRegistration } from "@/features/registrations";
import { ApiError } from "@/lib/http";
import { confirmPayment, rejectPayment } from "../api";
import { usePaymentRegistrations } from "../hooks/use-payment-registrations";
import { usePayment } from "../hooks/use-payments";

export function usePaymentDecisions(paymentId: string) {
  const { payment, isLoading, error, mutate } = usePayment(paymentId);
  const { registrations, isLoading: rowsLoading, mutate: mutateRegistrations } = usePaymentRegistrations(paymentId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decideReceipt(action: "confirm" | "reject", note?: string) {
    setWorking(true);
    try {
      if (action === "confirm") {
        await confirmPayment(paymentId);
        toast.success("رسید تأیید شد");
      } else {
        await rejectPayment(paymentId, note ?? "");
        toast.success("رسید رد شد");
      }
      await mutate();
      setRejectOpen(false);
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "انجام نشد. دوباره تلاش کنید");
    } finally {
      setWorking(false);
    }
  }

  async function decideRegistration(registrationId: string, action: "APPROVED" | "REJECTED", note?: string) {
    setBusyId(registrationId);
    try {
      if (action === "APPROVED") {
        await approveRegistration(registrationId);
        toast.success("ثبت نام تأیید شد");
      } else {
        await rejectRegistration(registrationId, note ?? "");
        toast.success("ثبت نام رد شد");
      }
      await mutateRegistrations();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "انجام نشد. دوباره تلاش کنید");
    } finally {
      setBusyId(null);
    }
  }

  return {
    payment,
    isLoading,
    error,
    mutate,
    registrations,
    rowsLoading,
    rejectOpen,
    setRejectOpen,
    working,
    busyId,
    decideReceipt,
    decideRegistration,
  };
}

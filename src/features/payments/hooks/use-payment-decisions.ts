"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateRegistrationStatus } from "@/features/registrations";
import { confirmPayment, rejectPayment } from "../api";
import { usePaymentRegistrations } from "../hooks/use-payment-registrations";
import { usePayment } from "../hooks/use-payments";

export function usePaymentDecisions(paymentId: string) {
  const { payment, isLoading, error, mutate } = usePayment(paymentId);
  const { registrations, students, isLoading: rowsLoading, mutate: mutateRegistrations } = usePaymentRegistrations(paymentId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decideReceipt(action: "confirm" | "reject", note?: string) {
    setWorking(true);
    try {
      if (action === "confirm") {
        await confirmPayment(paymentId);
        toast.success("رسید تأیید شد.");
      } else {
        await rejectPayment(paymentId, note ?? "");
        toast.success("رسید رد شد.");
      }
      await mutate();
      setRejectOpen(false);
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  async function decideRegistration(registrationId: string, status: "APPROVED" | "REJECTED") {
    setBusyId(registrationId);
    try {
      await updateRegistrationStatus(registrationId, status);
      toast.success(status === "APPROVED" ? "ثبت‌نام تأیید شد." : "ثبت‌نام رد شد.");
      await mutateRegistrations();
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
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
    students,
    rowsLoading,
    rejectOpen,
    setRejectOpen,
    working,
    busyId,
    decideReceipt,
    decideRegistration,
  };
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createPayment } from "@/features/payments";
import { createRegistrations } from "@/features/registrations";

export function useRegistrationSubmit({
  competitionId,
  coachId,
  amountRials,
  students,
}: {
  competitionId: string;
  coachId: string;
  amountRials: string;
  students: { studentId: string; weightClassId: string | null }[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function submit(receipt: File) {
    setSubmitting(true);
    try {
      const payment = await createPayment({
        competitionId,
        coachId,
        amount: amountRials,
        receiptKey: `receipts/mock-${Date.now()}-${receipt.name}`,
      });
      await createRegistrations({ competitionId, coachId, paymentId: payment.id, students });
      toast.success("ثبت‌نام انجام شد و رسید برای بررسی ارسال شد.");
      router.push("/coach/registrations");
    } catch {
      toast.error("انجام نشد. دوباره تلاش کنید.");
      setSubmitting(false);
    }
  }

  return { submitting, submit };
}

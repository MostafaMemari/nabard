"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createRegistrations } from "@/features/registrations";
import { ApiError } from "@/lib/http";

export function useRegistrationSubmit({
  competitionId,
  studentIds,
  weights,
}: {
  competitionId: string;
  studentIds: string[];
  weights?: Record<string, number>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function submit(receipt: File) {
    setSubmitting(true);
    try {
      await createRegistrations({ competitionId, studentIds, weights, receipt });
      toast.success("ثبت نام انجام شد و رسید برای بررسی ارسال شد");
      router.push("/coach/registrations");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "انجام نشد. دوباره تلاش کنید");
      setSubmitting(false);
    }
  }

  return { submitting, submit };
}

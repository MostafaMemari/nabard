"use client";
import { useState } from "react";
import { toast } from "sonner";
import { toPersianDigits } from "@/lib/format";
import { importStudents } from "../api";
import type { StudentImportRowError } from "../types";

export function useStudentImport({
  coachId,
  onOpenChange,
  onImported,
}: {
  coachId?: string;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<StudentImportRowError[]>([]);

  function close() {
    setFile(null);
    setWorking(false);
    setError(null);
    setRowErrors([]);
    onOpenChange(false);
  }

  async function submit() {
    if (!file) {
      setError("فایل اکسل را بارگذاری کنید");
      return;
    }

    setWorking(true);
    setError(null);
    setRowErrors([]);
    try {
      const result = await importStudents(file, coachId);
      if (result.errors.length > 0) {
        setRowErrors(result.errors);
        return;
      }
      toast.success(`${toPersianDigits(result.imported)} هنرجو ثبت شد و برای بررسی به ادمین استان ارسال شد`);
      close();
      onImported();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "بارگذاری انجام نشد. دوباره تلاش کنید");
    } finally {
      setWorking(false);
    }
  }

  return { file, setFile, working, error, rowErrors, close, submit };
}

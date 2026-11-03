"use client";

import { useState } from "react";
import { toast } from "sonner";
import { compressProfileImage } from "@/lib/compress-image";
import { deleteStudentDocument, uploadStudentDocument } from "../api";
import type { StudentDocumentType } from "../types";

export function useStudentDocuments(studentId: string, mutate: () => Promise<unknown>) {
  const [workingType, setWorkingType] = useState<StudentDocumentType | null>(null);

  async function upload(type: StudentDocumentType, file: File) {
    setWorkingType(type);

    try {
      const compressed = await compressProfileImage(file);
      await uploadStudentDocument(studentId, type, compressed);
      toast.success("مدرک ذخیره شد.");
      await mutate();
    } catch {
      toast.error("بارگذاری مدرک انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorkingType(null);
    }
  }

  async function remove(type: StudentDocumentType) {
    setWorkingType(type);

    try {
      await deleteStudentDocument(studentId, type);
      toast.success("مدرک حذف شد.");
      await mutate();
    } catch {
      toast.error("حذف مدرک انجام نشد.");
    } finally {
      setWorkingType(null);
    }
  }

  return { workingType, upload, remove };
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { compressReceiptImage } from "@/features/registrations";
import { deleteCoachPhoto, uploadCoachPhoto } from "../api";

export function useCoachPhoto() {
  const [working, setWorking] = useState(false);

  async function upload(file: File) {
    setWorking(true);

    try {
      const compressed = await compressReceiptImage(file);
      await uploadCoachPhoto(compressed);
      toast.success("عکس پروفایل ذخیره شد.");
      await mutate("me");
    } catch {
      toast.error("بارگذاری عکس انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    setWorking(true);

    try {
      await deleteCoachPhoto();
      toast.success("عکس پروفایل حذف شد.");
      await mutate("me");
    } catch {
      toast.error("حذف عکس انجام نشد.");
    } finally {
      setWorking(false);
    }
  }

  return { working, upload, remove };
}

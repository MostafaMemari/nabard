"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { logout } from "../api";

export function useLogout() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  async function signOut() {
    try {
      await logout();
    } catch {
      toast.error("خروج انجام نشد. دوباره تلاش کنید.");
      return;
    }
    await mutate(() => true, undefined, { revalidate: false });
    router.replace("/login");
    router.refresh();
  }

  return signOut;
}

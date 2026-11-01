"use client";

import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth";

export function LogoutButton({ className }: { className?: string }) {
  const signOut = useLogout();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="خروج از حساب"
      title="خروج از حساب"
      className={className}
      onClick={() => void signOut()}
    >
      <LogOutIcon aria-hidden />
    </Button>
  );
}

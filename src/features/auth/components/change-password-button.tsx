"use client";

import { KeyRoundIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "./change-password-dialog";

export function ChangePasswordButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="تغییر رمز عبور"
        title="تغییر رمز عبور"
        className={className}
        onClick={() => setOpen(true)}
      >
        <KeyRoundIcon aria-hidden />
      </Button>
      <ChangePasswordDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

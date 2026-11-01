"use client";

import { MapPinIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CoachProfileDialog } from "./coach-profile-dialog";

export function CoachProfileButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="پروفایل مربی"
        title="پروفایل مربی و شهرستان"
        className={className}
        onClick={() => setOpen(true)}
      >
        <MapPinIcon aria-hidden />
      </Button>
      <CoachProfileDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

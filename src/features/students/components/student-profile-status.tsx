"use client";

import { StatusBadge } from "@/components/shared";
import { type ProfileStatus, profileStatusKey } from "../types";

export function StudentProfileStatus({ status, note }: { status: ProfileStatus; note: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <StatusBadge status={profileStatusKey(status)} />
      {status === "REJECTED" && note ? <p className="rounded-lg bg-warning-bg px-3 py-2 text-subtle text-warning">{note}</p> : null}
    </div>
  );
}

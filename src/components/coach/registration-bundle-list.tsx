"use client";

import { StatusBadge } from "@/components/shared";
import type { RegistrationBundleStudent } from "@/features/registrations";
import { registrationStatusKey } from "@/features/registrations";

export function RegistrationBundleList({ bundle }: { bundle: RegistrationBundleStudent[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {bundle.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium">{item.studentName}</span>
            <StatusBadge status={registrationStatusKey(item.status)} />
          </div>
          {item.status === "REJECTED" && item.note ? <p className="text-subtle text-danger">دلیل رد: {item.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}

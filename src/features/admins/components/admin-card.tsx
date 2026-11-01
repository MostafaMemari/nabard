"use client";

import { Avatar, MobileCard, MobileCardLine, MobileCardTop, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/format";
import { provinceLabels } from "@/lib/provinces";
import type { AdminUser } from "../types";

export function AdminCard({
  admin,
  onToggleStatus,
  onEdit,
  onResetPassword,
}: {
  admin: AdminUser;
  onToggleStatus: (admin: AdminUser) => void;
  onEdit: (admin: AdminUser) => void;
  onResetPassword: (admin: AdminUser) => void;
}) {
  return (
    <MobileCard className="gap-3">
      <MobileCardTop
        leading={<Avatar id={admin.id} name={admin.fullName} size="md" />}
        title={admin.fullName}
        end={<StatusBadge status={admin.isActive ? "ACTIVE" : "INACTIVE"} />}
      />
      <MobileCardLine label="شماره همراه" value={<span className="tabular-nums">{toPersianDigits(admin.mobile)}</span>} />
      <MobileCardLine label="استان" value={provinceLabels[admin.province]} />
      <div className="-mx-4 -mb-4 border-t border-border p-2">
        <div className="flex items-center justify-between gap-1">
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(admin)}
          >
            ویرایش
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1 text-muted-foreground hover:text-foreground"
            onClick={() => onResetPassword(admin)}
          >
            بازنشانی رمز
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 flex-1 text-muted-foreground hover:text-foreground"
            onClick={() => onToggleStatus(admin)}
          >
            {admin.isActive ? "غیرفعال سازی" : "فعال سازی"}
          </Button>
        </div>
      </div>
    </MobileCard>
  );
}

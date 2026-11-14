"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Belt } from "@/features/base-data";

// Belt picker for the province review page. The select root needs the `items`
// map — without it Base UI cannot resolve the label and renders the raw id
// (e.g. "belt-blue") in the trigger.
export function StudentBeltEditor({
  initialBeltId,
  belts,
  disabled,
  onSave,
}: {
  initialBeltId: string;
  belts: Belt[];
  disabled?: boolean;
  onSave: (beltId: string) => Promise<unknown>;
}) {
  const [beltId, setBeltId] = useState(initialBeltId);
  const [working, setWorking] = useState(false);

  const changed = beltId !== initialBeltId;
  const beltItems = Object.fromEntries(belts.map((belt) => [belt.id, belt.label]));

  async function save() {
    setWorking(true);

    try {
      await onSave(beltId);
      toast.success("کمربند ثبت شد");
    } catch {
      toast.error("ثبت کمربند انجام نشد. دوباره تلاش کنید");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-card">
      <span className="text-sm font-semibold">ثبت کمربند</span>
      <p className="text-subtle text-muted-foreground">در صورت نیاز کمربند درخواست را پیش از تأیید اصلاح کنید</p>
      <Select value={beltId} items={beltItems} onValueChange={(value) => setBeltId(value ?? initialBeltId)} disabled={disabled}>
        <SelectTrigger aria-label="کمربند">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {belts.map((belt) => (
            <SelectItem key={belt.id} value={belt.id}>
              {belt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" disabled={!changed || working || disabled} onClick={() => void save()}>
        ذخیره کمربند
      </Button>
    </div>
  );
}

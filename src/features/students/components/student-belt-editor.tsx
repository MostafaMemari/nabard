"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Belt } from "@/features/base-data";
import { updateStudentBelt } from "../api";
import type { StudentDetail } from "../types";

export function StudentBeltEditor({ student, belts, onSaved }: { student: StudentDetail; belts: Belt[]; onSaved: () => Promise<unknown> }) {
  const [beltId, setBeltId] = useState(student.beltId);
  const [working, setWorking] = useState(false);

  const changed = beltId !== student.beltId;

  async function save() {
    setWorking(true);

    try {
      await updateStudentBelt(student.id, beltId);
      toast.success("کمربند هنرجو ثبت شد.");
      await onSaved();
    } catch {
      toast.error("ثبت کمربند انجام نشد. دوباره تلاش کنید.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-card">
      <span className="text-sm font-semibold">ثبت کمربند</span>
      <p className="text-subtle text-muted-foreground">کمربند هنرجو فقط توسط ادمین استان تغییر می کند.</p>
      <Select value={beltId} onValueChange={(value) => setBeltId(value ?? student.beltId)}>
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
      <Button size="sm" disabled={!changed || working} onClick={() => void save()}>
        ذخیره کمربند
      </Button>
    </div>
  );
}

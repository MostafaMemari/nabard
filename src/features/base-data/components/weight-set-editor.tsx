"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";
import { saveWeightClassSet } from "../api-admin";
import type { Gender } from "../types";
import { validateWeightClassSet } from "../weight-set-validation";
import { type EditorRow, toSetRow } from "./weight-set-row";

function newKey(): string {
  return `new-${Math.random().toString(36).slice(2, 9)}`;
}

function issueMessages(issuesByRow: Map<number, string[]>, index: number, needle: string): string[] {
  return (issuesByRow.get(index) ?? []).filter((message) => message.includes(needle));
}

export function WeightSetEditor({
  ageCategoryId,
  gender,
  initialRows,
  onSaved,
}: {
  ageCategoryId: string;
  gender: Gender;
  initialRows: EditorRow[];
  onSaved: () => void;
}) {
  const [editorRows, setEditorRows] = useState<EditorRow[]>(initialRows);
  const [saving, setSaving] = useState(false);

  const issues = useMemo(() => validateWeightClassSet(editorRows.map(toSetRow)), [editorRows]);
  const issuesByRow = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const issue of issues) {
      if (issue.index === null) continue;
      map.set(issue.index, [...(map.get(issue.index) ?? []), issue.message]);
    }
    return map;
  }, [issues]);
  const generalIssues = issues.filter((issue) => issue.index === null).map((issue) => issue.message);

  function update(key: string, patch: Partial<EditorRow>) {
    setEditorRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    const last = editorRows[editorRows.length - 1];
    setEditorRows((current) => [
      ...current,
      {
        key: newKey(),
        label: "",
        min: last !== undefined && last.max.trim() !== "" ? last.max : "",
        max: "",
        excludeMin: true,
        excludeMax: true,
        archived: false,
      },
    ]);
  }

  function removeRow(key: string) {
    setEditorRows((current) => current.filter((row) => row.key !== key));
  }

  async function save() {
    setSaving(true);
    try {
      const result = await saveWeightClassSet({ ageCategoryId, gender, rows: editorRows.map(toSetRow) });
      toast.success(
        `رده های وزنی ذخیره شد: ${toPersianDigits(result.created)} ردیف جدید، ${toPersianDigits(result.updated)} ویرایش، ${toPersianDigits(result.archived)} بایگانی، ${toPersianDigits(result.deleted)} حذف.`,
      );
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره انجام نشد. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">وزن</TableHead>
            <TableHead className="w-32">برچسب</TableHead>
            <TableHead className="w-24">حداقل (کیلوگرم)</TableHead>
            <TableHead className="w-24">حداکثر (کیلوگرم)</TableHead>
            <TableHead className="w-14">شروع باز</TableHead>
            <TableHead className="w-14">پایان باز</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">حذف</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {editorRows.map((row, index) => (
            <TableRow key={row.key}>
              <TableCell className="text-subtle font-medium text-muted-foreground">وزن {toPersianDigits(index + 1)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Input
                    value={row.label}
                    onChange={(event) => update(row.key, { label: event.target.value })}
                    aria-label="برچسب رده وزنی"
                    className="w-28"
                  />
                  {row.archived ? <Badge variant="secondary">بایگانی</Badge> : null}
                </div>
                {issueMessages(issuesByRow, index, "برچسب").map((message) => (
                  <p key={message} className="text-danger mt-1 text-xs">
                    {message}
                  </p>
                ))}
              </TableCell>
              <TableCell>
                <Input
                  value={row.min}
                  onChange={(event) => update(row.key, { min: event.target.value })}
                  inputMode="decimal"
                  aria-label="حداقل وزن"
                  className="w-20"
                />
                {issueMessages(issuesByRow, index, "حداقل").map((message) => (
                  <p key={message} className="text-danger mt-1 text-xs">
                    {message}
                  </p>
                ))}
              </TableCell>
              <TableCell>
                <Input
                  value={row.max}
                  onChange={(event) => update(row.key, { max: event.target.value })}
                  inputMode="decimal"
                  aria-label="حداکثر وزن"
                  className="w-20"
                />
                {issueMessages(issuesByRow, index, "حداکثر").map((message) => (
                  <p key={message} className="text-danger mt-1 text-xs">
                    {message}
                  </p>
                ))}
              </TableCell>
              <TableCell>
                <Switch
                  checked={row.excludeMin}
                  onCheckedChange={(checked) => update(row.key, { excludeMin: checked })}
                  aria-label="شروع باز"
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Switch
                    checked={row.excludeMax}
                    onCheckedChange={(checked) => update(row.key, { excludeMax: checked })}
                    aria-label="پایان باز"
                  />
                  {issueMessages(issuesByRow, index, "مرز").map((message) => (
                    <p key={message} className="text-danger text-xs">
                      {message}
                    </p>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon-sm" onClick={() => removeRow(row.key)} aria-label={`حذف ردیف ${index + 1}`}>
                  <Trash2Icon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-subtle text-muted-foreground">
        «شروع باز» یعنی وزنی که دقیقا برابر حداقل است در این رده قرار نمی گیرد و «پایان باز» یعنی وزنی که دقیقا برابر حداکثر است در این رده
        قرار نمی گیرد.
      </p>

      <div className="flex flex-col gap-3">
        <Button variant="outline" size="sm" className="w-fit" onClick={addRow}>
          <PlusIcon data-icon="inline-start" />
          افزودن ردیف
        </Button>

        {generalIssues.map((message) => (
          <p key={message} className="text-danger text-sm">
            {message}
          </p>
        ))}

        <div className="flex items-center justify-between gap-3">
          <p className="text-subtle text-muted-foreground">
            تغییرها فقط روی مسابقه های جدید اعمال می شود؛ مسابقه های منتشر شده و ثبت نام های قبلی تغییری نمی کنند.
          </p>
          <Button onClick={() => void save()} disabled={saving || issues.length > 0}>
            ذخیره
          </Button>
        </div>
      </div>
    </div>
  );
}

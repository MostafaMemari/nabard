"use client";

import { Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";
import type { EditorRow } from "./weight-set-row";

function issueMessages(issuesByRow: Map<number, string[]>, index: number, needle: string): string[] {
  return (issuesByRow.get(index) ?? []).filter((message) => message.includes(needle));
}

export function WeightSetTable({
  editorRows,
  issuesByRow,
  onUpdate,
  onRemove,
}: {
  editorRows: EditorRow[];
  issuesByRow: Map<number, string[]>;
  onUpdate: (key: string, patch: Partial<EditorRow>) => void;
  onRemove: (key: string) => void;
}) {
  return (
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
                  onChange={(event) => onUpdate(row.key, { label: event.target.value })}
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
                onChange={(event) => onUpdate(row.key, { min: event.target.value })}
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
                onChange={(event) => onUpdate(row.key, { max: event.target.value })}
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
                onCheckedChange={(checked) => onUpdate(row.key, { excludeMin: checked })}
                aria-label="شروع باز"
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Switch
                  checked={row.excludeMax}
                  onCheckedChange={(checked) => onUpdate(row.key, { excludeMax: checked })}
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
              <Button variant="ghost" size="icon-sm" onClick={() => onRemove(row.key)} aria-label={`حذف ردیف ${index + 1}`}>
                <Trash2Icon />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

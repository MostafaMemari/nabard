"use client";

import { Trash2Icon } from "lucide-react";
import { MobileCard, MobileCardTop } from "@/components/shared";
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

function IssueList({ issuesByRow, index, needle }: { issuesByRow: Map<number, string[]>; index: number; needle: string }) {
  const messages = issueMessages(issuesByRow, index, needle);
  if (messages.length === 0) {
    return null;
  }
  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {messages.map((message) => (
        <p key={message} className="text-danger text-xs">
          {message}
        </p>
      ))}
    </div>
  );
}

function CardField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-subtle text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

// Mobile variant of the editor grid above: one card per weight class, same inputs.
function WeightSetCards({
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
    <div className="flex flex-col gap-3 md:hidden">
      {editorRows.map((row, index) => (
        <MobileCard key={row.key}>
          <MobileCardTop
            title={`وزن ${toPersianDigits(index + 1)}`}
            end={
              <Button variant="ghost" size="icon-sm" onClick={() => onRemove(row.key)} aria-label={`حذف ردیف ${index + 1}`}>
                <Trash2Icon />
              </Button>
            }
          />
          <div className="flex items-center gap-2">
            <Input
              value={row.label}
              onChange={(event) => onUpdate(row.key, { label: event.target.value })}
              aria-label="برچسب رده وزنی"
              className="w-full"
            />
            {row.archived ? <Badge variant="secondary">بایگانی</Badge> : null}
          </div>
          <IssueList issuesByRow={issuesByRow} index={index} needle="برچسب" />
          <div className="grid grid-cols-2 gap-3">
            <CardField label="حداقل (کیلوگرم)">
              <Input
                value={row.min}
                onChange={(event) => onUpdate(row.key, { min: event.target.value })}
                inputMode="decimal"
                aria-label="حداقل وزن"
              />
              <IssueList issuesByRow={issuesByRow} index={index} needle="حداقل" />
            </CardField>
            <CardField label="حداکثر (کیلوگرم)">
              <Input
                value={row.max}
                onChange={(event) => onUpdate(row.key, { max: event.target.value })}
                inputMode="decimal"
                aria-label="حداکثر وزن"
              />
              <IssueList issuesByRow={issuesByRow} index={index} needle="حداکثر" />
            </CardField>
          </div>
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2 text-sm">
              <Switch
                checked={row.excludeMin}
                onCheckedChange={(checked) => onUpdate(row.key, { excludeMin: checked })}
                aria-label="شروع باز"
              />
              شروع باز
            </span>
            <span className="flex items-center gap-2 text-sm">
              <Switch
                checked={row.excludeMax}
                onCheckedChange={(checked) => onUpdate(row.key, { excludeMax: checked })}
                aria-label="پایان باز"
              />
              پایان باز
            </span>
          </div>
          <IssueList issuesByRow={issuesByRow} index={index} needle="مرز" />
        </MobileCard>
      ))}
    </div>
  );
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
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-card md:block">
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
      </div>
      <WeightSetCards editorRows={editorRows} issuesByRow={issuesByRow} onUpdate={onUpdate} onRemove={onRemove} />
    </>
  );
}

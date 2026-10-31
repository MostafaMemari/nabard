"use client";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

export function DataTablePagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
      <span>مجموع {formatNumber(total)} مورد</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          قبلی
        </Button>
        <span>
          صفحه {formatNumber(page)} از {formatNumber(pageCount)}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
          بعدی
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { normalizeDigits } from "@/lib/format";
import type { EventDayRow } from "../types";

export type EventDayFilter = "all" | "no-weigh" | "out-of-weight" | "checked-in";

function matchesQuery(row: EventDayRow, query: string): boolean {
  if (query.trim() === "") return true;

  const needle = query.trim();
  const needleDigits = normalizeDigits(needle);

  return (
    row.student.fullName.includes(needle) ||
    row.coachName.includes(needle) ||
    (needleDigits !== "" && row.student.nationalCode.includes(needleDigits))
  );
}

function matchesFilter(row: EventDayRow, filter: EventDayFilter): boolean {
  if (filter === "no-weigh") return row.weighInVerdict === null;
  if (filter === "out-of-weight") return row.weighInVerdict === "OUT_OF_WEIGHT";
  if (filter === "checked-in") return row.checkInAt !== null;

  return true;
}

export function useEventDayView(rows: EventDayRow[], kyorugi: boolean) {
  const [filter, setFilter] = useState<EventDayFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => rows.filter((row) => matchesQuery(row, query) && matchesFilter(row, filter)), [rows, filter, query]);

  const tabs = useMemo(() => {
    const items: Array<{ id: string; label: string }> = [{ id: "all", label: "همه" }];
    if (kyorugi) items.push({ id: "no-weigh", label: "توزین نشده" }, { id: "out-of-weight", label: "خارج از وزن" });

    items.push({ id: "checked-in", label: "حاضر" });

    return items;
  }, [kyorugi]);

  return { filter, setFilter, query, setQuery, filtered, tabs };
}

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { provinceLabels, provinceValues } from "@/lib/provinces";
import { useSearchParam } from "@/lib/use-search-param";

export function ProvinceFilter() {
  const [value, setValue] = useSearchParam("province");
  const items: Record<string, string> = {
    all: "همه استان ها",
    ...Object.fromEntries(provinceValues.map((province) => [province, provinceLabels[province]])),
  };

  return (
    <Select
      items={items}
      value={value === "" ? "all" : value}
      onValueChange={(next) => {
        if (next !== null) setValue(next === "all" ? null : String(next));
      }}
    >
      <SelectTrigger className="w-full sm:w-48" aria-label="استان">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.keys(items).map((item) => (
          <SelectItem key={item} value={item}>
            {items[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DatePartSelect({
  items,
  value,
  placeholder,
  onChange,
  disabled,
}: {
  items: Record<string, string>;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select items={items} value={value === "" ? "" : value} onValueChange={(next) => onChange(String(next))} disabled={disabled}>
      <SelectTrigger aria-label={placeholder} className="w-full justify-between">
        <SelectValue placeholder={placeholder} />
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

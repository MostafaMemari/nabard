import { BeltChip } from "@/components/shared/belt-chip";
import type { Belt } from "@/features/base-data";

export function BeltChips({ belts, ids }: { belts: Belt[]; ids: string[] }) {
  const selected = ids
    .map((id) => belts.find((belt) => belt.id === id))
    .filter((belt): belt is Belt => belt !== undefined)
    .sort((left, right) => left.level - right.level);

  if (selected.length === 0) {
    return "—";
  }

  return (
    <span className="flex flex-wrap items-center gap-1">
      {selected.map((belt) => (
        <BeltChip key={belt.id} belt={belt} />
      ))}
    </span>
  );
}

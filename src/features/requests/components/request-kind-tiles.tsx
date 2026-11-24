"use client";

import { ArrowLeftRightIcon, ImageUpIcon, type LucideIcon, MapPinnedIcon, UserPlusIcon } from "lucide-react";

export type RequestTileId = "registration" | "photo" | "coach" | "province";

type RequestTile = {
  id: RequestTileId;
  label: string;
  description: string;
  icon: LucideIcon;
};

const tiles: RequestTile[] = [
  { id: "registration", label: "ثبت هنرجو", description: "فرم ثبت هنرجوی جدید", icon: UserPlusIcon },
  { id: "photo", label: "تغییر عکس", description: "عکس جدید یکی از هنرجوها", icon: ImageUpIcon },
  { id: "coach", label: "تغییر مربی", description: "انتقال به مربی دیگر استان", icon: ArrowLeftRightIcon },
  { id: "province", label: "تغییر استان", description: "انتقال به مربی استان دیگر", icon: MapPinnedIcon },
];

export function RequestKindTiles({ onPick }: { onPick: (id: RequestTileId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          onClick={() => onPick(tile.id)}
          className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-4 text-start shadow-card transition-colors hover:border-primary/60"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <tile.icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            {tile.label}
          </span>
          <span className="text-subtle text-muted-foreground">{tile.description}</span>
        </button>
      ))}
    </div>
  );
}

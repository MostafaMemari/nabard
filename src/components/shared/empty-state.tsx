import { InboxIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "./icon-tile";

export function EmptyState({
  title,
  action,
  icon = InboxIcon,
  tone = "pending",
}: {
  title: string;
  action?: ReactNode;
  icon?: Parameters<typeof IconTile>[0]["icon"];
  tone?: "primary" | "success" | "warning" | "danger" | "pending";
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
      <IconTile icon={icon} tone={tone} />
      <p className="max-w-xs text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

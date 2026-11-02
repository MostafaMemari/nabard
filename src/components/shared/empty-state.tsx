import { InboxIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "./icon-tile";

export function EmptyState({
  title,
  description,
  action,
  icon = InboxIcon,
  tone = "pending",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: Parameters<typeof IconTile>[0]["icon"];
  tone?: "primary" | "success" | "warning" | "danger" | "pending";
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
      <IconTile icon={icon} tone={tone} />
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="text-subtle text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

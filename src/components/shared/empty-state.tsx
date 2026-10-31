import { InboxIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <InboxIcon aria-hidden className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}

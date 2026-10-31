import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold leading-tight">{title}</h1>
        {description ? <p className="text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

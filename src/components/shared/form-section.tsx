import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "./icon-tile";

export function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
      <div className="flex items-center gap-3">
        {icon ? <IconTile icon={icon} /> : null}
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? <p className="text-subtle text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

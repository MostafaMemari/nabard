import type { ReactNode } from "react";

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description ? <p className="text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

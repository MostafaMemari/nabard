import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SectionCard } from "./section-card";

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
    <SectionCard title={title} description={description} icon={icon}>
      {children}
    </SectionCard>
  );
}

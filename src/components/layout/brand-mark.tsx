import { cn } from "cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary", className)}>
      <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none">
        <title>نشان نبرد</title>
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.92" />
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="white" strokeOpacity="0.92" strokeWidth="1.2" />
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="white" strokeOpacity="0.92" strokeWidth="1.2" />
        <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white" fillOpacity="0.92" />
      </svg>
    </span>
  );
}

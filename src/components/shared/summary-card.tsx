import Link from "next/link";

export function SummaryCard({ value, label, href, linkLabel }: { value: string; label: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-5 shadow-card">
      <span className="text-display font-semibold">{value}</span>
      <span className="text-subtle text-muted-foreground">{label}</span>
      {href && linkLabel ? (
        <Link href={href} className="mt-1 w-fit text-subtle font-medium text-primary underline-offset-4 hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

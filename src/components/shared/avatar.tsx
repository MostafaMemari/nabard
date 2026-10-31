import { cn } from "cn";

const tints = [
  "bg-primary-subtle text-primary",
  "bg-tint-teal-bg text-tint-teal-fg",
  "bg-warning-bg text-warning",
  "bg-tint-rose-bg text-tint-rose-fg",
  "bg-pending-bg text-pending",
  "bg-success-bg text-success",
] as const;

const sizeStyles = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-sm",
  lg: "size-10 text-sm",
} as const;

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return `${first}${last}`;
}

function tintOf(id: string): (typeof tints)[number] {
  let sum = 0;
  for (const char of id) {
    sum += char.codePointAt(0) ?? 0;
  }
  return tints[sum % tints.length] ?? tints[0];
}

export function Avatar({ id, name, size = "md" }: { id: string; name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none", tintOf(id), sizeStyles[size])}
    >
      {initialsOf(name)}
    </span>
  );
}

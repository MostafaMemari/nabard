import { Skeleton } from "@/components/ui/skeleton";

export default function CoachLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex flex-col gap-3">
        {["card-1", "card-2", "card-3"].map((key) => (
          <Skeleton key={key} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-card">
        <span className="text-4xl font-bold text-muted-foreground">۴۰۴</span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold">صفحه پیدا نشد</h1>
          <p className="text-sm text-muted-foreground">نشانی ای که باز کرده اید وجود ندارد یا جابه جا شده است</p>
        </div>
        <Button type="button" render={<Link href="/" />}>
          بازگشت به خانه
        </Button>
      </div>
    </main>
  );
}

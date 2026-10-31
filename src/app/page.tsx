import { APP_NAME, APP_SUBTITLE } from "@/lib/app";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{APP_NAME}</h1>
        <p className="text-[13px] text-muted-foreground">{APP_SUBTITLE}</p>
      </header>
      <section className="rounded-xl border p-6">
        <p className="text-sm">این نسخه پایه است. صفحات مدیریت مسابقات و ثبت نام هنرجویان در ادامه اضافه می شوند.</p>
      </section>
    </main>
  );
}

import { PageHeader } from "@/components/shared";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-content flex-col gap-6 p-4 md:p-8">
      <PageHeader title={APP_NAME} description={APP_SUBTITLE} />
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm">این نسخه پایه است. صفحات مدیریت مسابقات و ثبت نام هنرجویان در ادامه اضافه می شوند.</p>
      </section>
    </main>
  );
}

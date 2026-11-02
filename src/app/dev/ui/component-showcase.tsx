"use client";

import { Avatar, BeltChip, DeadlineChip, StatusBadge, type StatusKey, SummaryCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useBelts } from "@/features/base-data";
import { formatNumber } from "@/lib/format";

const statuses: StatusKey[] = ["AWAITING_PAYMENT", "PENDING_REVIEW", "APPROVED", "REJECTED", "CANCELED", "DRAFT", "PUBLISHED"];

const showcaseBeltNames = ["white", "yellow", "green", "blue", "red", "poom_1", "poom_3", "dan_1", "dan_3"];

const people = [
  { id: "coach-1", name: "رضا محمدی" },
  { id: "coach-2", name: "سعید احمدی" },
  { id: "admin-1", name: "حمیدرضا کاظمی" },
  { id: "coach-3", name: "مهدی کریمی" },
  { id: "coach-4", name: "حسین موسوی" },
  { id: "coach-5", name: "امیر حسین زاده" },
];

const sizePerson = { id: "coach-1", name: "رضا محمدی" };

const now = new Date("2026-10-31T12:00:00.000Z");

const deadlines = [
  { id: "passed", deadline: "2026-10-01T20:30:00.000Z" },
  { id: "soon", deadline: "2026-11-02T20:30:00.000Z" },
  { id: "today", deadline: "2026-10-31T23:59:00.000Z" },
  { id: "far", deadline: "2026-12-20T20:30:00.000Z" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function ComponentShowcase() {
  const { belts } = useBelts();
  const showcaseBelts = showcaseBeltNames.map((code) => belts.find((belt) => belt.code === code)).filter((belt) => belt !== undefined);

  return (
    <div className="flex flex-col gap-8">
      <Section title="کارت های خلاصه">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard value={formatNumber(3)} label="رسید در انتظار بررسی" href="#" linkLabel="مشاهده فهرست" />
          <SummaryCard value={formatNumber(2)} label="مسابقه باز" href="#" linkLabel="مشاهده مسابقات" />
          <SummaryCard value={formatNumber(12)} label="ثبت نام این هفته" />
        </div>
      </Section>

      <Section title="آواتارها">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-2">
              <Avatar id={person.id} name={person.name} />
              <span className="text-sm">{person.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 border-s border-border ps-4">
            <Avatar id={sizePerson.id} name={sizePerson.name} size="sm" />
            <Avatar id={sizePerson.id} name={sizePerson.name} size="md" />
            <Avatar id={sizePerson.id} name={sizePerson.name} size="lg" />
          </div>
        </div>
      </Section>

      <Section title="کمربندها">
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-5 shadow-card">
          {showcaseBelts.map((belt) => (
            <BeltChip key={belt.id} belt={belt} />
          ))}
        </div>
      </Section>

      <Section title="وضعیت ها">
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-5 shadow-card">
          {statuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="نشانگر مهلت">
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-5 shadow-card">
          {deadlines.map((item) => (
            <DeadlineChip key={item.id} deadline={item.deadline} now={now} />
          ))}
        </div>
      </Section>

      <Section title="دکمه ها">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button">مسابقه جدید</Button>
            <Button type="button" variant="secondary">
              ذخیره
            </Button>
            <Button type="button" variant="outline">
              انصراف
            </Button>
            <Button type="button" variant="ghost">
              پاک کردن جستجو
            </Button>
            <Button type="button" variant="destructive">
              رد رسید
            </Button>
            <Button type="button" variant="link">
              مشاهده فهرست
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm">
              کوچک
            </Button>
            <Button type="button" size="default">
              پیش فرض
            </Button>
            <Button type="button" size="lg">
              بزرگ
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}

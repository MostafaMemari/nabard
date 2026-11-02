"use client";

import { MedalIcon, ReceiptTextIcon, TrophyIcon } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { CoachShell } from "@/components/layout/coach-shell";
import { Avatar, DeadlineChip, StatusBadge, SummaryCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber } from "@/lib/format";

const pendingReceipts = [
  { id: "pay-1", coach: "سعید احمدی", competition: "مسابقات قهرمانی استان تهران", students: 6, amount: 21_000_000 },
  { id: "pay-2", coach: "مهدی کریمی", competition: "مسابقات نونهالان آقایان", students: 4, amount: 10_000_000 },
  { id: "pay-3", coach: "حسین موسوی", competition: "مسابقات نوجوانان بانوان", students: 5, amount: 12_500_000 },
];

const upcomingCompetitions = [
  { id: "comp-1", title: "مسابقات قهرمانی استان تهران", deadline: "2026-11-20T20:30:00.000Z", registrations: 48 },
  { id: "comp-2", title: "مسابقات نونهالان آقایان", deadline: "2026-11-10T20:30:00.000Z", registrations: 31 },
];

const now = new Date("2026-10-31T12:00:00.000Z");

function AdminShellDemo() {
  return (
    <AdminShell active="payments">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard value={formatNumber(3)} label="رسید در انتظار بررسی" href="#" linkLabel="مشاهده فهرست" />
        <SummaryCard value={formatNumber(2)} label="مسابقه باز" href="#" linkLabel="مشاهده مسابقات" />
        <SummaryCard value={formatNumber(12)} label="ثبت نام این هفته" href="#" linkLabel="مشاهده ثبت نام ها" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <ReceiptTextIcon aria-hidden className="size-4.5 text-muted-foreground" strokeWidth={1.75} />
              نیازمند اقدام
            </h3>
            <StatusBadge status="PENDING_REVIEW" />
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {pendingReceipts.map((receipt) => (
              <li key={receipt.id} className="flex items-center gap-3 py-2.5">
                <Avatar id={receipt.id} name={receipt.coach} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-medium">{receipt.coach}</span>
                  <span className="truncate text-subtle text-muted-foreground">
                    {receipt.competition} · {formatNumber(receipt.students)} هنرجو
                  </span>
                </div>
                <span className="text-sm tabular-nums">{formatMoney(receipt.amount)}</span>
                <Button type="button" size="sm" variant="outline">
                  بررسی
                </Button>
              </li>
            ))}
          </ul>
        </section>
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <TrophyIcon aria-hidden className="size-4.5 text-muted-foreground" strokeWidth={1.75} />
              مسابقات پیش رو
            </h3>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {upcomingCompetitions.map((competition) => (
              <li key={competition.id} className="flex items-center gap-3 py-2.5">
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-medium">{competition.title}</span>
                  <span className="text-subtle text-muted-foreground">{formatNumber(competition.registrations)} ثبت نام</span>
                </div>
                <DeadlineChip deadline={competition.deadline} now={now} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}

const openCompetitions = [
  { id: "comp-1", title: "مسابقات قهرمانی استان تهران", deadline: "2026-11-20T20:30:00.000Z", fee: 3_500_000 },
  { id: "comp-4", title: "مسابقات پومسه بزرگسالان", deadline: "2026-12-01T20:30:00.000Z", fee: 2_000_000 },
];

const myStudents = [
  { id: "reg-1", name: "علی توکلی", belt: "آبی", status: "APPROVED" as const },
  { id: "reg-2", name: "امیر قاسمی", belt: "سبز", status: "PENDING_REVIEW" as const },
];

function CoachShellDemo() {
  return (
    <CoachShell active="home">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard value={formatNumber(2)} label="مسابقه باز" />
        <SummaryCard value={formatNumber(9)} label="ثبت نام من" />
        <SummaryCard value={formatNumber(1)} label="در انتظار بررسی" />
      </div>
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <MedalIcon aria-hidden className="size-4.5 text-muted-foreground" strokeWidth={1.75} />
          مسابقات باز
        </h3>
        <ul className="flex flex-col divide-y divide-border">
          {openCompetitions.map((competition) => (
            <li key={competition.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium">{competition.title}</span>
                <span className="text-subtle text-muted-foreground">{formatMoney(competition.fee)}</span>
              </div>
              <DeadlineChip deadline={competition.deadline} now={now} />
              <Button type="button" size="sm">
                ثبت نام
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-base font-semibold">ثبت نام های من</h3>
        <ul className="flex flex-col divide-y divide-border">
          {myStudents.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-2.5">
              <Avatar id={row.id} name={row.name} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium">{row.name}</span>
                <span className="text-subtle text-muted-foreground">کمربند {row.belt}</span>
              </div>
              <StatusBadge status={row.status} />
            </li>
          ))}
        </ul>
      </section>
    </CoachShell>
  );
}

export { AdminShellDemo, CoachShellDemo };

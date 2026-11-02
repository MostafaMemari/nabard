# نبرد (Nabard)

سامانه مدیریت مسابقات تکواندو استان تهران - ثبت نام هنرجوها توسط مربی ها، بارگذاری رسید پرداخت کارت به کارت و بررسی و تأیید آن ها توسط مدیریت استان.

> این مخزن قبلاً با نام «میدان» (meydan) شناخته می شد و به «نبرد» (nabard) تغییر نام یافت.

## وضعیت پروژه

فاز فعلی: **UI-first** - تمام صفحات با داده های نمونه (mock) کار می کنند و هنوز به بک اند متصل نیستند.

## راه اندازی

```bash
pnpm install
pnpm dev
```

سپس:

- `/` - صفحه اصلی
- `/login` - صفحه ورود
- `/dev/ui` - گالری کامپوننت ها و شِل ها برای بازبینی طراحی

## اسکریپت ها

| دستور | کار |
| --- | --- |
| `pnpm dev` | اجرای سرور توسعه |
| `pnpm build` | بیلد نسخه پروداکشن |
| `pnpm check` | بررسی lint و فرمت با Biome |
| `pnpm fix` | اعمال خودکار اصلاحات Biome |
| `pnpm typecheck` | بررسی تایپ ها با TypeScript |
| `pnpm test` | اجرای تست ها با Vitest |

## تکنولوژی ها

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Base UI) · SWR · Zustand · zod + react-hook-form · date-fns-jalali · Biome · Vitest

فونت پروژه **Vazirmatn** است و همه صفحات راست به چپ (RTL) و فارسی هستند.

## مستندات

- [`AGENTS.md`](AGENTS.md) - قوانین کار روی این مخزن؛ قبل از هر تغییری بخوانید
- [`docs/DESIGN.md`](docs/DESIGN.md) - سند طراحی (v2)؛ هر تغییر UI باید مطابق آن باشد
- [`docs/api.md`](docs/api.md) - قرارداد API
- [`docs/schema.prisma`](docs/schema.prisma) - مدل داده

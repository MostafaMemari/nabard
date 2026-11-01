# نبرد (Nabard)

سامانه مدیریت مسابقات تکواندو استان تهران - ثبت نام هنرجوها توسط مربی ها، بارگذاری رسید پرداخت کارت به کارت و بررسی و تأیید آن ها توسط مدیریت استان.

> این مخزن قبلاً با نام «میدان» (meydan) شناخته می شد و به «نبرد» (nabard) تغییر نام یافت.

## پیش نیازها

- Node.js 20 یا جدیدتر
- pnpm (`corepack enable`)
- یک پایگاه داده PostgreSQL (تولید: [Neon](https://neon.tech)؛ توسعه محلی: هر PostgreSQL استاندارد)

## متغیرهای محیطی

فایل `.env` در ریشه پروژه بسازید:

| متغیر | اجباری | توضیح |
| --- | --- | --- |
| `DATABASE_URL` | بله | رشته اتصال PostgreSQL. در تولید رشته pooled حباب (pooler) Neon را بگذارید. |
| `DIRECT_URL` | خیر | اتصال مستقیم برای مهاجرت ها؛ خالی یعنی همان `DATABASE_URL`. |
| `SESSION_SECRET` | توصیه شده | کلید امضای کوکی نشست. اگر خالی باشد از `DATABASE_URL` مشتق می شود؛ با تغییر `DATABASE_URL` همه نشست ها باطل می شوند. |
| `NEXT_PUBLIC_API_URL` | خیر | پایه URL فراخوانی های API از مرورگر؛ خالی یعنی همان دامنه. |
| `ADMIN_MOBILE` | برای seed | شماره همراه حساب مدیر استان. |
| `ADMIN_PASSWORD` | برای seed | رمز عبور مدیر (حداقل ۸ کاراکتر). |
| `ADMIN_PROVINCE` | برای seed | استان مدیر، مثلا `TEHRAN`. |

هیچ متغیر دیگری برای اجرا لازم نیست. `.env` هرگز کامیت نمی شود.

## راه اندازی محلی

```bash
pnpm install
pnpm db:migrate          # ساخت جداول با مهاجرت ها
pnpm db:seed             # داده های پایه + حساب مدیر از ADMIN_*
pnpm db:seed:dev         # فقط برای توسعه: داده های نمونه (مربی، هنرجو، مسابقه، پرداخت نمونه)
pnpm dev
```

سپس:

- `/login` - ورود با `ADMIN_MOBILE` و `ADMIN_PASSWORD`
- `/admin` - بخش مدیریت استان
- `/coach` - بخش مربی
- `/dev/ui` - گالری کامپوننت ها؛ فقط در حالت توسعه کار می کند و در بیلد پروداکشن ۴۰۴ است.

## پاک کردن داده های نمونه

اسکریپت `db:clean-demo` همه داده های ساخته شده با `db:seed:dev` (مربی ها، هنرجوها، مسابقه ها، پرداخت ها، ثبت نام ها و فایل رسیدهای نمونه) را حذف می کند و داده های پایه (کمربند، رده سنی، رده وزنی) و حساب واقعی مدیر از `ADMIN_*` را نگه می دارد. این اسکریپت بدون پرچم تایید اجرا نمی شود و فقط شمارش ردیف ها را چاپ می کند، هرگز داده شخصی را:

```bash
pnpm db:clean-demo -- --yes
```

## اسکریپت ها

| دستور | کار |
| --- | --- |
| `pnpm dev` | اجرای سرور توسعه |
| `pnpm build` | `prisma generate` + `prisma migrate deploy` + بیلد پروداکشن |
| `pnpm start` | اجرای نسخه پروداکشن |
| `pnpm check` | بررسی lint و فرمت با Biome |
| `pnpm fix` | اعمال خودکار اصلاحات Biome |
| `pnpm typecheck` | بررسی تایپ ها با TypeScript |
| `pnpm test` | اجرای تست ها با Vitest |
| `pnpm db:migrate` | ساخت یا اعمال مهاجرت ها در توسعه |
| `pnpm db:seed` | داده های پایه و حساب مدیر |
| `pnpm db:seed:dev` | داده های نمونه توسعه (در production خطا می دهد) |
| `pnpm db:clean-demo` | حذف داده های نمونه (نیازمند `-- --yes`) |

## استقرار (Vercel + Neon)

1. یک پروژه Neon بسازید و رشته اتصال pooled را بردارید.
2. در Vercel این متغیرها را ست کنید: `DATABASE_URL` (pooled)، `DIRECT_URL` (اتصال مستقیم)، `SESSION_SECRET` (یک رشته تصادفی بلند)، `NEXT_PUBLIC_API_URL` خالی.
3. دامنه را وصل کنید؛ بیلد خودش `prisma migrate deploy` را اجرا می کند و مهاجرت ها روی Neon اعمال می شوند.
4. اولین ورود: حساب مدیر را با اجرای `pnpm db:seed` روی همان پایگاه داده بسازید (یک بار، از خط فرمان با `DATABASE_URL` تولید).
5. `GET /api/v1/health` برای مانیتورینگ آماده است؛ پاسخ ۲۰۰ یعنی پایگاه داده در دسترس است.

## نکات امنیتی

- نشست: کوکی `nabard_session` با JWT امضاشده (HS256)؛ `HttpOnly`، `SameSite=Lax` و `Secure` در تولید.
- ورود: بعد از ۵ تلاش ناموفق در ۱۵ دقیقه (به تفکیک شماره همراه و هش IP)، ورود ۱۵ دقیقه مسدود می شود و پیام فارسی می دهد.
- سرصفحه های امنیتی: `Content-Security-Policy`، `X-Content-Type-Options`، `Referrer-Policy`، `X-Frame-Options: DENY` و `Permissions-Policy` روی همه مسیرها.
- رسیدها فایل خصوصی اند و فقط از طریق نقطه پایانی احراز هویت شده سرو می شوند؛ نوع فایل با امضای بایت (magic bytes) و حجم حداکثر ۲ مگابایت سمت سرور بررسی می شود.
- رمزهای عبور با bcrypt هش می شوند و هیچ پاسخ یا لاگی هش یا رمز را برنمی گرداند.

## تکنولوژی ها

Next.js 16 (App Router) · React · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Base UI) · Prisma 7 + PostgreSQL (آداپتور Neon) · SWR · zod + react-hook-form · jose · bcryptjs · date-fns-jalali · Biome · Vitest

فونت پروژه **Vazirmatn** است و همه صفحات راست به چپ (RTL) و فارسی هستند.

## مستندات

- [`AGENTS.md`](AGENTS.md) - قوانین کار روی این مخزن؛ قبل از هر تغییری بخوانید
- [`docs/DESIGN.md`](docs/DESIGN.md) - سند طراحی (v2)؛ هر تغییر UI باید مطابق آن باشد
- [`docs/api.md`](docs/api.md) - قرارداد کامل API
- [`prisma/schema.prisma`](prisma/schema.prisma) - مدل داده

# DESIGN.md (v2)

Design brief for the taekwondo competition app. Every UI change must follow this file.

Design read: an operator tool for admins and coaches in Tehran taekwondo, calm premium SaaS in a navy/blue language, dial ENERGY 1 / RHYTHM 1 / MOTION 1. Uniform rhythm and near-zero motion are deliberate, not defaults. Identity motif: dark navy sidebar with the brand mark, belt chips as domain color, and the tatami grid pattern plus a six-segment belt progression strip (white to dan, the athlete's path) on the login brand panel only.

## Goal

A modern, polished, premium-feeling admin product for Tehran taekwondo competitions. It should feel like a well-funded SaaS product: calm, spacious, crisp, with a clear identity. Admins review many rows; coaches, often on phones, register students and upload a receipt.

Polish comes from craft (spacing, type, depth, small meaningful details), not from decoration. If `design/` holds reference screenshots, match their quality.

## Principles

1. Clear hierarchy: one page title, one primary action, sections with titles.
2. Depth through layers: soft app background, white cards, a dark sidebar. Not through effects.
3. Domain details that mean something: belt chips, avatars, deadline indicators.
4. One accent color. Color means action or status.
5. Consistent rhythm: the same spacing, radius and row height everywhere.

## Tokens

Define once in `globals.css` using the shadcn CSS variable system, converting hex to the installed token format. Never hard-code colors in components.

| Token | Value |
| --- | --- |
| app background | #f5f6fa |
| card / surface | #ffffff |
| border | #e6e8ee |
| text | #0f172a |
| text-muted | #5d6d82 |
| sidebar background | #0f1629 |
| sidebar text | #cbd5e1 |
| sidebar active background | rgba(255,255,255,0.08), text #ffffff |
| primary (buttons, links, focus) | #2f5fe3 |
| primary-hover | #264fc2 |
| primary-subtle (selected row, active chip) | #eaf0ff |
| success | text #15803d on #e8f7ee |
| warning | text #b45309 on #fff4e0 |
| danger | text #cd1d1d on #fdecec |
| pending | text #475569 on #eef0f4 |

Belt chip dot colors: white #ffffff with border, yellow #facc15, green #22c55e, blue #3b82f6, red #ef4444, poom #7f1d1d, dan #111827.

Avatar tints (deterministic by id, soft background with darker text of the same hue): blue, teal, amber, rose, slate, green.

Sizes and depth:

- Radius: 8px inputs and buttons, 12px cards, 16px dialogs and sheets.
- Cards: white, 1px border, shadow `0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)`. Overlays: `0 8px 24px rgba(16,24,40,0.12)`.
- Controls (inputs, buttons, selects): 40px high, 44px on coach mobile screens.
- Table row 52px with comfortable padding, header 44px. Sidebar 256px. Page padding 32px desktop, 16px mobile. Max content width 1200px.
- Typography: Vazirmatn. Base 14.5px, table text 14px, secondary 13px muted, page title 24px semibold, section title 16px semibold, large numbers 28px semibold. Line height about 1.7.
- Icons: lucide-react, 18px in navigation, 16px in buttons, stroke 1.75.
- Motion: 150 to 200ms ease-out for hover, focus, overlays and sheet open. Skeletons instead of spinners. No bouncing or entrance animations.

## Signature elements

These make the product feel designed. Use them consistently.

- **Dark sidebar** with the brand mark and name at the top, grouped nav items, an active item with a soft highlight and a 3px primary bar on the start edge, and the user (avatar, name, role) at the bottom.
- **Avatars with initials** next to every person's name in tables and headers.
- **Belt chips**: small pill with a colored dot and the belt name wherever a belt appears.
- **Status badges**: soft tinted pill with a dot and a Persian label.
- **Deadline indicator** on competitions: «۳ روز مانده» chip, warning color under 3 days, danger color when passed.
- **Summary cards** at the top of home pages: a number, a label and an optional link to the filtered list. No icon-in-circle decoration, no fake trends.
- **Subtle page header**: title, one-line description in muted text, primary action on the end side, breadcrumbs only on detail pages.

## Layout

- Admin: dark sidebar on the start side, app background behind content, content in white cards.
- Coach: mobile-first with a clean top bar and bottom navigation on phones, sidebar on desktop. 44px touch targets. Tables become card lists below 768px (see Mobile cards).
- Forms: single column, max width 640px inside a card, labels above inputs, helper text only when needed, error directly under the field, actions at the end.
- Detail pages: header card (avatar or icon-less title, status badge, actions), then cards per topic with description lists. Side summary column sticky on desktop.

## Components

- Use shadcn components as the base and style them through tokens. Make buttons, inputs, selects and badges match the sizes above.
- One primary button per view. Secondary actions are outline or ghost. Destructive actions ask for confirmation.
- Empty state: a calm card with a small neutral icon, one sentence and one button. No stock illustrations.
- Loading: skeletons that match the final layout. Errors: inline message with a retry button.
- Toasts only for the result of a user action. Dialogs for confirmation and short forms; longer forms use a side sheet or their own page.

## Data views

- Every list page: page header, a toolbar card (search, filters as removable chips, optional view tabs with counts), the table card, pagination with total count and a page size select.
- Rows: avatar plus name as the link, belt chips, status badges, row actions in an overflow menu. Row hover uses a very light surface tint, selected rows use primary-subtle.
- Sorting on header click. Filter, sort and page state live in the URL.
- Row click opens the record page. Short edits open in a side sheet.
- Bulk actions bar appears above the table after selecting rows.
- Below 768px a table becomes a list of cards (see Mobile cards). Filters move to a bottom sheet.

## Mobile cards

Below 768px every table is replaced by a list of cards. Never squeeze columns and never scroll horizontally. Re-organize the data by priority instead.

- Card: white, 12px radius, hairline border, soft shadow, 16px padding, 12px gap between cards. The whole card is one tap target (min 44px) that opens the record.
- Top row: avatar or leading element and the title on the start side, the status badge on the end side.
- Body: at most two secondary lines of the most important facts as short label and value pairs (small muted label, regular value). Chips (belt, deadline) sit in one wrapping row.
- Footer (optional): the single most useful action as a text button, and an overflow menu.
- Lowest-priority columns are not shown on the card; they appear on the record page.
- Selection lists (for example choosing students to register) use cards with a checkbox at the start; ineligible cards are dimmed and show the reason in muted text.
- Totals and the main action live in a sticky bottom bar with safe-area padding.

## Screen blueprints

**Login.** Split screen on desktop: the form on the start side (max width 380px, vertically centered, app name, subtitle, mobile and password fields, full-width primary button), and a brand panel on the end side filling the rest: deep navy with a soft gradient from #0f1629 to #1b2a52, a subtle geometric line pattern (tatami grid, drawn in SVG at low opacity), the app name large, the subtitle, and under it a small six-segment belt strip (white, yellow, green, blue, red, dan) as the domain signature. No photos, no marketing copy. On mobile only the form shows, with the brand mark above it.

**Admin home.** Summary cards: receipts awaiting review, open competitions, registrations this week. Below, two cards side by side: «نیازمند اقدام» (latest pending receipts, each row with coach avatar, amount, time, a review button) and «مسابقات پیش رو» (title, deadline chip, registration count).

**Admin competitions list.** Header with «مسابقه جدید». Toolbar with search and status tabs with counts (همه، پیش نویس، منتشر شده، لغو شده). Table: title with discipline, age category, gender, belt range chips, deadline chip, registrations count, status.

**Admin competition form.** Single card sections: «اطلاعات پایه»، «شرکت کنندگان» (gender, age category, belt from and to), «زمان و پرداخت» (deadline, event date, fee, payee card number, card holder). For kyorugi, a read-only weight class table appears in «شرکت کنندگان». Actions at the end.

**Admin payments review.** List with status tabs and counts; table: coach with avatar, competition, student count, amount, date, status. Detail page: two columns. Main: receipt image card, then student table with per-row approve and reject. Side (sticky): coach, competition, student count, total, confirm and reject receipt buttons. Rejection opens a dialog that requires a note.

**Admin coaches.** List with avatar, name, mobile, student count, status; create in a side sheet; detail page lists the coach's students.

**Coach home.** Summary cards (open competitions, my registrations, awaiting review). «مسابقات باز» as rows with deadline chip, fee and a «ثبت نام» button. «ثبت نام های من» as a table that becomes stacked rows on mobile.

**Coach registration.** Compact competition summary card. Student list with checkboxes: eligible first, ineligible dimmed below with the reason in muted text. Sticky bottom bar on mobile (summary bar on desktop) with selected count, total and «ادامه». Next view: payee card number with a copy button, amount, receipt upload with preview, submit.

**Coach students.** Same list anatomy; form is one column, max width 560px; belt select, Jalali birth date picker, weight with one decimal.

## Copy rules

- No ZWNJ (نیم‌فاصله) anywhere in UI text. Write compounds with a plain space: «ثبت نام های من»، «مسابقه جدید». The owner rejected ZWNJ styling as it reads machine-generated.
- Write like a human operator, not a copywriter: short plain sentences, concrete nouns, no filler adjectives, no marketing tone, no over-explaining the obvious. A button says the verb it does; an empty state says what is missing and offers one action.

## Copy glossary

Navigation: خانه، مسابقات، بررسی پرداخت ها، مربیان، هنرجویان، ثبت نام های من.
Actions: مسابقه جدید، هنرجوی جدید، ثبت نام هنرجویان، آپلود رسید، تأیید رسید، رد رسید، تأیید ثبت نام، رد ثبت نام، ذخیره، انصراف، حذف.
Statuses: در انتظار پرداخت (warning)، در انتظار بررسی (pending)، تأیید شده (success)، رد شده (danger)، لغو شده (pending)، پیش نویس (pending)، منتشر شده (success).
Empty states: «هنوز مسابقه ای ثبت نشده است.»، «هنوز هنرجویی اضافه نکرده اید.»، «پرداختی برای بررسی وجود ندارد.»
Errors say what is wrong and what to do: «کد ملی باید ۱۰ رقم باشد.»
Persian digits and thousands separators; Jalali dates; money through `lib/format.ts`.

## Banned patterns

- Glassmorphism, blur, glow, neon.
- Purple, indigo or violet. Gradients other than the login brand panel.
- Emoji and sparkle icons. Stock illustrations. Marketing copy or hero sections inside the app.
- Icon-in-colored-circle stat cards, fake charts, fake trend arrows.
- Cards inside cards. Heavy shadows. Rainbow badges.
- Lorem ipsum, «John Doe», English labels, «Welcome back».
- Animation beyond the 150 to 200ms transitions above.

## Review checklist

- Looks like a polished modern SaaS product, not a default template and not a bare skeleton.
- Hierarchy is clear on every screen: one title, one primary action, titled sections.
- Only tokens for color, radius, shadow and spacing. No arbitrary values.
- Signature elements are used consistently: avatars, belt chips, status badges, deadline chips.
- RTL is correct: logical classes, mirrored icons and arrows, Persian digits.
- Loading, empty and error states exist and look intentional.
- Keyboard works: visible focus ring, logical tab order, dialogs trap focus.
- 1440px and 390px widths both look right with realistic demo data.
- Every string is Persian, concrete and typo-free.

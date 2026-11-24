# UI Audit

## Consistency pass — phase checklist

Status: `[ ]` not started, `[~]` in progress, `[x]` done and pushed. If a run is interrupted, continue from the first unfinished phase.

- [x] **Phase 1 — Foundations.** Token audit (spacing 4/8/12/16/24/32, card padding 16 mobile/24 desktop, radius, shadows, row/control heights, font and icon sizes) and shared-component audit (PageHeader, FormSection/SectionCard, ListToolbar/FilterBar, DataTable/DataList with mobile cards, EmptyState, Skeletons, FormSection, FormActions, StatusBadge, chips). Changed: Card padding token 20→16/24 (`ui/card.tsx`), FormSection and SummaryCard padding 20→16/24, FormActions rebuilt as a sticky bottom action bar on mobile (safe-area padding, card look, consistent cancel/submit order), EmptyState double font-size class fixed, filter-sheet count badge 11px→12px token, deadline-extension dialog max-height unified to 85dvh.
- [x] **Phase 2 — Coach screens.** Reviewed home, competitions, competition detail, registration flow, payment step, registrations list and detail, students list/form/detail, profile dialog, transfers at 390/768/1440. Changed: added shared `SectionCard` (section header + action) and `StateCard` (loading/empty shell); refactored competition detail, registration detail, competition summary and transfers section onto SectionCard; replaced three ad-hoc error banners with shared `ErrorBanner`; card/empty states now use `StateCard`; refunds list uses `MobileCard` and got a loading skeleton (was `null`, layout jump); removed all double font-size classes (`text-subtle` + `text-xs`/`text-sm`, 9 files); competition list card padding 20→16/24; split over-80 files with a real seam: filter sheet (counting hook + pure `countStudentFilters` + tests, chip file, active-filters file), student profile (header/tiles/documents), transfer request dialog (dialog hook), receipt upload (preview/compress hook), registration timeline (pure `buildRegistrationSteps`), coach home (data hook), bundle list and side summary, selection group. Remaining 80–150-line files are single-concern dialogs/flows kept intact per the AGENTS hard limit.
- [x] **Phase 3 — Admin screens.** Reviewed home, competitions list/form/detail, payments review and detail, profile review, refunds, transfers, coaches list/detail, counties, coach requests at 390/768/1440. Changed: admin home summary cards extracted to `AdminSummaryCards` (data-driven); competition status actions extracted to `useCompetitionStatusActions` hook (three duplicated try/catch toasts unified, messages still from `competitionStatusConfig`); weight-class rules helper moved to `useWeightClassesFor`; registration-table columns moved to `competition-registrations-columns`; payment side summary, payment students section, payment receipt card and competition registrations section refactored onto `SectionCard`; coach detail identity and students sections onto `SectionCard`; counties screen split (`CountyRow`) with `StateCard` states; payment/profile review loading skeletons use `StateCard`; direct `rows-skeleton` imports normalized to the shared index; remaining ad-hoc section-card class strings removed from features (final grep: only print-specific variants left).
- [x] **Phase 4 — Super admin screens and login.** Reviewed home, admins, counties view, base data tabs, coaches and competitions views and login at 390/768/1440 (super panel verified live on production with the seeded super admin). Changed: weight-set editor split (`WeightSetTable`, was 212 lines — over the hard limit); super counties view loads with province-card skeletons instead of a spinner and its empty/group states use `StateCard`; admins, coaches, competitions and base-data screens already sat on the shared DataTable/SectionCard patterns with no one-off styles found; login form already follows the LTR-field rules (`dir="ltr"`, `inputMode`, `autoComplete`, 44px mobile controls).
- [x] **Phase 5 — Cross-cutting.** Copy rules: removed the last ZWNJ characters from UI strings (7 occurrences) and unified «تایید» → «تأیید» with the DESIGN glossary across 33 files (server data and tests reverted intentionally — official county names keep their spelling); no long dashes found. Forms: 24px between form groups (was 16px), 16px inside sections. Dialogs: padding moved to the 16/24 scale with matching footer margins. Loading: last in-content spinner (weight classes tab) replaced with a shaped skeleton in StateCard; route-level Suspense fallbacks intentionally keep the shared spinner. Focus: keyboard focus-visible rings added to tappable card links (MobileCardLink, registration-history rows). Verified already-good: toasts tokenized, tables keep in-cell links for keyboard access, 44px mobile targets, logical RTL classes, no raw locale formatting, muted text contrast 4.9:1. Acceptances: single-concern dialogs of 80–150 lines stay unsplit; sort buttons inside desktop tables remain pointer-sized.

## Phase 1 — Research findings (applied)

### Tables → cards on mobile
- Re-organize data by priority: identity (avatar + name), then status, then 1–2 key facts; lowest-priority columns move to the record page, never squeezed or horizontally scrolled.
- The whole card is one tap target (≥44px) opening the record; per-row actions collapse into a text button + overflow menu in the footer.
- Filter/sort controls move into a bottom sheet below 768px so the list stays clean; counts stay visible on the trigger.
- Cards must keep their loading/empty/error states; skeletons should match card shapes, not table shapes.

### RTL dashboards
- Use logical classes only (ms-/me-/ps-/pe-/start-/end-); never physical left/right for layout or spacing; let flow direction place the sidebar.
- Mirror directional icons (back/forward arrows, chevrons, breadcrumbs) in RTL; never mirror universal icons (search, check, close, calendar, settings).
- Inherently LTR values (mobile, national code, card number, password) need `dir="ltr"`, `text-align: start` kept logical, and their own input direction even inside an RTL form.
- Persian digits and thousands separators for all displayed numbers; keep Latin digits only inside LTR input fields.

### Mobile forms & bottom bars
- Labels above inputs, never placeholder-as-label; error text directly under the field; helper text only when needed.
- Inputs ≥44px tall on coach mobile screens; numeric/Latin fields get `inputMode` + `autoComplete`; font-size ≥16px on mobile inputs to prevent iOS focus zoom.
- Multi-step flows keep totals and the primary action in a sticky bottom bar with `env(safe-area-inset-bottom)` padding; content gets matching bottom padding so nothing hides behind it.
- One primary button per view; secondary actions are outline/ghost; destructive actions behind a confirm dialog.

## Phase 2 — Routes

| # | Route | Area |
| --- | --- | --- |
| 1 | `/` | redirect |
| 2 | `/login` | auth |
| 3 | `/admin` | admin home |
| 4 | `/admin/competitions` | admin list |
| 5 | `/admin/competitions/new` | admin form |
| 6 | `/admin/competitions/[id]` | admin detail |
| 7 | `/admin/competitions/[id]/edit` | admin form |
| 8 | `/admin/payments` | admin list |
| 9 | `/admin/payments/[id]` | admin review detail |
| 10 | `/admin/coaches` | admin list |
| 11 | `/admin/coaches/[id]` | admin detail |
| 12 | `/coach` | coach home |
| 13 | `/coach/competitions` | coach list |
| 14 | `/coach/competitions/[id]/register` | coach registration flow |
| 15 | `/coach/registrations` | coach list |
| 16 | `/coach/students` | coach list |
| 17 | `/coach/students/new` | coach form |
| 18 | `/coach/students/[id]` | coach form/detail |
| 19 | `/dev/ui` | dev showcase (frozen) |

## Phase 2 — Issues

Viewport audit result: no page-level horizontal overflow anywhere (document scrollWidth = innerWidth on all 18 routes × 3 viewports, zero console errors). All overflow findings below are inner scroll containers (tables) measured with a DOM probe; several mobile screenshots initially showed artifacts from full-page capture in RTL and were re-verified live.

| # | Route / file | Issue | Severity |
| --- | --- | --- | --- |
| 1 | `/admin` | Admin home is a «به زودی» placeholder; DESIGN blueprint (summary cards, «نیازمند اقدام», «مسابقات پیش رو») not built. Signature screen. | high |
| 2 | `/admin/competitions` | Table scrolls horizontally inside the card at 768/390 (probe sw 771 vs cw 446/356); belt chips stack vertically at 768. No card mode below 768. | high |
| 3 | `/admin/payments` | Same: table overflow at 768/390 (sw 763). No card mode. | high |
| 4 | `/coach/registrations`, `/coach` | Registrations table overflows at 768 (sw 823); table/card switch happens at container 512px so widths 512–1152 get an overflowing table. | high |
| 5 | `/admin/competitions/[id]` | Registrations table overflows at 390 (sw 506 vs 316). | high |
| 6 | `/admin/coaches/[id]` | Students table overflows at 390 (sw 432 vs 316). | high |
| 7 | All list pages | Filters stay inline below 768; DESIGN requires a bottom sheet for filters on mobile. | medium |
| 8 | `/admin/*` <768px | No navigation at all on admin mobile (sidebar hidden below md, top bar has brand only). | medium |
| 9 | Registration flow | Selectable student list renders as rows, not Mobile-cards anatomy (checkbox cards, dimmed ineligible with reason, registered state). | medium |
| 10 | FilterTabs, DataTablePagination, row action buttons, belt choice chips | Touch targets 32px on mobile (audit threshold 44px). | medium |
| 11 | Login form, student form, competition form | No `dir="ltr"` + inputMode/autoComplete on Latin/numeric fields (mobile, national code, card number, password). | medium |
| 12 | Global CSS | `prefers-reduced-motion` not honored. | medium |
| 13 | DataTablePagination, SummaryCard, some numeric cells | Numbers lack tabular numerals; pagination uses arbitrary `text-[13px]`, avatar `text-[11px]`. | low |
| 14 | Table headers | Sort buttons ~20px tall (desktop-only, inside table). | low |
| 15 | Coach home «مسابقات باز» empty | Plain `<p>` instead of the shared EmptyState. | low |
| 16 | `/dev/ui` | Frozen showcase; no functional issues found; left as is. | low |

Verified non-issues: login form layout at 390 is correct live (screenshot artifact); inputs are 16px on mobile (hidden RHF internals report 14.5px but are unfocusable); deadline chip colors match DESIGN (warning ≤3 days, danger when passed); back/forward arrows mirror correctly in RTL; skeletons, empty states and error banners exist on all lists; focus-visible rings present on buttons and inputs; sidebar/nav/nav-labels use logical classes throughout.

## Resolution (post-fix)

Issues 1–6 fixed by a shared card mode on `DataTable` (`renderCard`) with per-column `minScreen` triage, one `MobileCard` anatomy, bottom-sheet filters (`ListToolbar`), and mobile bottom navigation in `AdminShell`. Issue 7 fixed in `ListToolbar`; issue 8 fixed with the admin bottom nav; issue 9 rebuilt as selection cards with dimmed ineligible rows and reasons; issues 10–13 fixed (44px mobile targets, `dir="ltr"` + inputMode/autoComplete on numeric fields, `prefers-reduced-motion`, tabular numerals, token widths). Issue 14 accepted: sort buttons live inside desktop-only tables. Issue 15 fixed by reusing the shared empty state. Final sweep: 54/54 route–viewport checks with no page overflow and zero console errors.

Remaining accepted deviations: `/dev/ui` demo files stay over 80 lines (frozen showcase); table-header sort buttons are pointer-sized (desktop-only context).

## Consistency pass 2 — domains built after the first audit

Scope: requests, photo/province/county changes, refunds, transfers, admins, super, analytics and their routes — audited after the resolution above, fixed in the same pass. Also covers the inline filter grid that replaced the ListToolbar bottom sheet (the owner chose always-visible filters, three per row on mobile).

- High: 17 `text-success/text-danger hover:…` outline recipes replaced by two sanctioned treatments — paired decisions use `variant="outline"` (approve) and `variant="destructive"` (reject), quiet per-row destructive secondaries keep ghost with a real `hover:bg-danger-bg` (students card delete, receipt image remove). Hover state was identical to rest in all old recipes.
- High: 13 `max-w-md/lg` DialogContent widths prefixed with `sm:` so the base `max-w-[calc(100%-2rem)]` holds on phones (dialogs were edge-to-edge below 640px).
- Medium: approve buttons in the four decision dialogs got a working state (disabled + «در حال ثبت…»); double-submit was possible before.
- Medium: new shared `Note` callout (warning/primary tones) replaced 13 hand-rolled `bg-*-bg px-3 py-2…` paragraphs with two paddings; coach-facing dialog footers now use `DialogFooter` with outline cancels, matching the admin dialogs.
- Medium: county-change coach dialog error state moved to shared `ErrorBanner`; transfer route arrows unified to `→`; receipt download link rebuilt on Button `render={<a/>}`.
- Medium: `size="sm"` buttons reachable on mobile got the `h-11` bump (`coach/requests` row actions, admin home empty action, coach dialog actions, `ErrorBanner` retry).
- Structure: `coach-requests-screen` (338 lines) split into `request-rows`/`request-card`/`request-status-card`/`use-request-rows`; `new-request-dialog` (237) split into `request-kind-tiles` (config-driven, kills the repeated tile class string) + dialog; all under the 150-line limit.
- Low: review cards (photo, province, county, transfer, refund, super coaches, super home summary) migrated onto the `MobileCard` family; `/super/base-data` got the Suspense + `ScreenSpinner` wrapper its siblings have.

Accepted deviations: `BarList` keeps its quiet inner empty line (inside a chart card, not a data view); the bordered icon callouts on the request edit screen and student profile header stay custom (distinct visual intent); chart axis micro-labels (`text-[10px]/[11px]`) are deliberate chart typography.

Validation: biome, tsc, vitest (663 tests) and the production build pass; overflow probe (`scrollWidth = innerWidth`) clean on 25 routes at 390px (super, admin and coach shells including the pages above) and 1280px spot checks; screenshot review of the county-change card (standardized decision pair), coach requests page (mobile and desktop). Service test fixtures with hardcoded deadlines (`2026-11-20`) were moved to relative dates after they began expiring against the real clock.

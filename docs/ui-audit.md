# UI Audit

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

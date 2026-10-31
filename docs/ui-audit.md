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

(To be filled by the audit.)

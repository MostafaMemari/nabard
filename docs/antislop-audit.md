# antislop Audit

Numbered findings from auditing this repository against `antislop.md` (core, v3.2.24, installed at the repo root) and its task skills under `skills/antislop-*`. Mode: after (audit existing work, report numbers, fix approved items). Findings are numbered `AS-NNN` and never reset; a new audit session continues from the last number. Priority follows the rule tier: Hard Gate = HIGH, Purpose-Gate = MEDIUM, Quality Locks = LOW.

## Audit 001, 2026-11-01 (1405/08/10)

Scope: all 18 live routes (`/dev/ui` is a frozen showcase, inspected but out of scope for changes), shared components, Persian copy, code comments, and agent-written docs.

Method: rule-by-rule scan of `src/` (rg probes for em dash, ZWNJ, slop icon names, gradient/backdrop-blur/glow, generic CTAs and buzzwords, TODO placeholders, `outline: none` without replacement, comment inventory), cross-checked against the click-through and overflow evidence recorded in `docs/ui-audit.md` (54/54 route-viewport checks) and the dials declared in `docs/DESIGN.md`.

### Findings

| # | Rule | Priority | Where | Finding | Status |
| --- | --- | --- | --- | --- | --- |
| AS-001 | R-02, C-1 | HIGH | `src/features/competitions/components/coach-competition-list.tsx`, `src/components/coach/registration-flow.tsx`, `src/features/competitions/components/competition-detail-screen.tsx`, `src/components/coach/coach-competition-detail-screen.tsx` | Field label leaked into a dot-separated value line: «کیوروگی · رده سنی بزرگسال · پسر». Segments of one meta line must be parallel values; a label glued to one value reads machine-made. Fixed to values only with one canonical order everywhere (رشته · رده سنی · جنسیت): «کیوروگی · بزرگسال · پسر». Labeled contexts (table headers, form labels, info terms) correctly keep the term. | Fixed 2026-11-01, user-reported; 3 latent instances cleaned in the same pass |
| AS-002 | R-02 | HIGH | `README.md` | Em dashes (`—`) in agent-written documentation, 7 occurrences. R-02 bans the character in any text the agent writes; the carve-out covers only antislop's own files. Replaced with hyphens, matching the earlier `chore(copy)` pass over UI strings. | Fixed 2026-11-01 |

No other Hard Gate, Purpose-Gate, or Quality Lock violation found in this audit.

### Verified clean (Delivery Gate, audit 001)

Block 1, Hard Gate (all no):

- R-02: no em dash in `src/` or docs after AS-002 (rg: 0 hits outside `antislop.md`).
- R-03: no page-level horizontal overflow, 54/54 route-viewport checks in `docs/ui-audit.md`; card mode below 768px.
- R-17, R-18, R-36: no statistics, testimonials, trust or performance claims anywhere; dashboard figures come from the SWR mock API in `features/*/mock` (declared MVP data stage).
- R-23: brand is `APP_NAME` text («نبرد») with the factual subtitle; no invented logo, photos or avatars; initials only for real record rows.
- R-24: every nav item targets a real route (admin: home, competitions, payments, coaches; coach: home, competitions, students, registrations); no dead links.
- R-25: AA contrast token fix landed earlier (commit `255cc0c`).
- R-26, R-27: every button and link wired (click-through logged in `docs/ui-audit.md`); every list ships skeleton, empty and error states.
- R-32: focus-visible rings on inputs and buttons; Base UI dialogs close on Escape; no bare `outline: none` (shadcn base pairs it with a focus-visible ring).
- R-33: no patch scripts in the repository.
- R-21, R-34: single light theme by owner direction (`AGENTS.md` lists dark mode as out of scope); nothing to break.
- R-35: build plus click-through evidence recorded in `docs/ui-audit.md`.
- R-38: copy is factual product prose; mock people and data follow the realism rules in `AGENTS.md`.
- R-39: `cursor: pointer` base layer (commit `10bd2ce`); icon-only buttons carry `aria-label`; the receipt `<img>` has alt, width and height; `prefers-reduced-motion` honored in `globals.css`.
- R-40: the single `<img>` has dimensions; no third-party render-blocking scripts.

Block 2, Purpose-Gate (technique present, reason written):

- R-01: one gradient, the login brand panel (`.login-brand-panel`, `#0f1629` to `#1b2a52`), documented in `docs/DESIGN.md`.
- R-04: Lucide icons map to domain meaning (discipline to swords/stance, nav to trophy/users/receipt); relevance recorded in the DESIGN icon map.
- R-06: Vazirmatn as the Persian RTL identity face, reason documented.
- R-07: tatami grid SVG on the login brand panel only, declared identity motif.
- R-08: arrows only on directional CTAs (RTL inline-end), not on every button.
- R-09: badges are real statuses only (StatusBadge, CountdownChip); no capsule decoration.
- R-10, R-13: no backdrop blur, no glow.
- R-12: one elevation token (`shadow-card`) as a calm depth marker.
- R-14: card sizes vary with content hierarchy (summary rows, list rows, student cards).
- R-19: no template motion; MOTION dial is 1, only 150ms state transitions and reduced-motion support.
- R-22: no illustrations.

Block 3, Liveliness (all yes):

- Dials declared in `docs/DESIGN.md` design read: ENERGY 1 / RHYTHM 1 / MOTION 1, uniform rhythm stated as deliberate.
- Identity motif present: dark navy sidebar with brand mark, belt chips as domain color, tatami brand panel.
- One deliberate accent: the single blue primary action per view; focal point per screen is the page title row with its primary action.

Block 4, Quality Locks (all no):

- R-05: dashboard composition built from content needs; no landing templates.
- R-11: radius tokens only (8px controls, 12px cards, 16px dialogs).
- R-15, R-16: CTAs specific (ثبت نام، تایید رسید، ویرایش); no buzzwords.
- R-29: navy plus one blue accent plus semantic status colors.
- R-30: no product clone.
- R-31: one-line reasons recorded in `docs/DESIGN.md`.

### Accepted deviations

- `/dev/ui` demo files stay over 80 lines (frozen showcase, also noted in `docs/ui-audit.md`).
- Table-header sort buttons are pointer-sized (desktop-only context).

## Audit 002, 2026-11-01 (1405/08/10)

Scope: whole-project pass over `src/` re-probed with the rule greps, plus a full read of the layout shells, the shared summary-card path, both home screens, the app sidebar and the login brand panel. External articles consulted: Presbitero, «5 AI Website Design Tips For Websites That Does not Look AI-Built» (unpromptable.substack.com); AdminLTE, «12 Best Dashboard Design Examples 2026» (adminlte.io); «10 Signs Your Website Was Designed by AI» (coachingsitesthatwork.com); Muz.li, «50 Best Dashboard Design Examples for 2026» (muz.li). Takeaways applied: the icon-tinted stat card row is a top AI-dashboard tell; color belongs to state, not decoration; hierarchy must surface the screen's first question.

Method: rg probes re-run over `src/` (em dash, ZWNJ, emoji, backdrop-blur/glow/pulse: 0 hits), read of every `SummaryCard`/`IconTile` usage (17 files), shells and brand panel read in full.

### Findings

| # | Rule | Priority | Where | Finding | Status |
| --- | --- | --- | --- | --- | --- |
| AS-003 | R-31, C-1, `docs/DESIGN.md` | HIGH | `src/components/shared/summary-card.tsx`, `src/components/admin/admin-home-screen.tsx`, `src/components/coach/coach-summary-cards.tsx` | Summary cards shipped the icon-in-tinted-tile stat card: the exact pattern `docs/DESIGN.md` bans («No icon-in-circle decoration») and a headline AI-dashboard tell in the articles. The number is the focal point, not an icon. Icon/tone props removed from the component and both call sites; loading skeletons resized h-24 to h-32 to match the real card height. `IconTile` stays where the glyph names an entity (discipline tiles on rows, receipt/upload section tiles, empty states, R-04). | Fixed 2026-11-01 |
| AS-004 | R-24, R-26 | HIGH | `src/components/layout/admin-shell.tsx` | Desktop admin sidebar received `navItems.slice(1)`: «خانه» existed only in the mobile bottom nav, so on desktop no nav item (and no brand link) led back to `/admin` from detail pages. Full item list restored; group label corrected to «پنل مدیریت», symmetric with the coach shell's «پنل مربی». | Fixed 2026-11-01 |
| AS-005 | R-20, R-31 | MEDIUM | `src/app/(auth)/login/login-brand-panel.tsx`, `docs/DESIGN.md` | The only brand surface leaned on a stock navy gradient and pattern with no domain signature. Added a six-segment belt progression strip (white, yellow, green, blue, red, dan) under the subtitle: the athlete's path, drawn from the existing belt tokens, aria-hidden, 176px wide. Reason recorded in `docs/DESIGN.md` (identity motif line and login blueprint). The colors are the product's own domain scale, not a rainbow ornament. | Fixed 2026-11-01 |
| AS-006 | R-31 | LOW | `src/components/layout/admin-shell.tsx`, `src/components/layout/coach-shell.tsx` | `MobileNavItem`/`BottomNavItem` and the bottom-nav wrapper were verbatim copies across the two shells (only breakpoints differ), a drift risk for the primary mobile navigation. Extracted to `src/components/layout/mobile-bottom-nav.tsx`. No visual change. | Fixed 2026-11-01 |

### Accepted deviations

- `DeadlineChip` (static), `CountdownChip` (live), `CountdownLarge` and `DeadlineProgress` are four components for one concept, but each encodes a distinct presentation (list cell, ticking chip, large tile, progress bar); consolidation would risk regressions for no visual gain.
- `IconTile` leading elements on rows, detail sections, form sections and empty states stay: the glyph names the entity it labels (R-04); the ban covers stat cards only.

### Verified clean (delta scan, audit 002)

- R-02, R-04 (emoji), R-07/R-10/R-13 (grid, blur, glow), R-19 (pulse/loop): rg probes over `src/` return 0 hits.
- R-24: after AS-004 both shells expose all four routes on desktop and mobile.
- R-29: no new colors; the belt strip reuses belt tokens on the documented brand panel gradient.
- R-39: the strip is `aria-hidden`; navigation stays native `Link` with `aria-current`; no new interactive elements.
- R-40: summary-card skeletons match final card height after AS-003.

## Next audit

Continue from AS-007. A new audit session appends an `Audit NNN` section here with the date and its own findings table; numbers never restart and fixed items stay in the table with their fix date.

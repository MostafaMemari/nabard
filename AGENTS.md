# AGENTS.md

Rules for every AI agent working in this repository. Read this file fully before writing code. Read `docs/DESIGN.md` before touching any UI.

## Project

Taekwondo competition management system (Persian, RTL). MVP flow:

1. An admin creates a competition.
2. A coach registers eligible students and uploads a card-to-card payment receipt.
3. The province admin confirms or rejects the receipt, then approves or rejects each student.

Source documents live in `docs/`: the requirements document, `schema.prisma` and `DESIGN.md`. Do not change business rules on your own. If something is unclear, ask.

## Stack

- Next.js (latest stable, App Router), React, TypeScript (strict)
- Tailwind CSS and shadcn/ui
- Prisma 7 with PostgreSQL
- SWR for client data fetching. Zustand only when state must be shared across distant components.
- zod for validation, react-hook-form for forms
- shadcn style is base-nova (Base UI, not Radix). The registry has no `form` component. Build forms with the shadcn `Field` components and react-hook-form `Controller`. Do not hand-write a `form.tsx`.
- Biome for lint and format. Do not add ESLint or Prettier.
- pnpm as the package manager
- Vitest for unit tests of pure logic

## Working method

- Work on one step at a time. Implement only what the current step asks for.
- Keep the solution as simple as possible. No speculative features, no abstractions without a second use.
- Before finishing a step run: `pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Fix every failure.
- Prefer existing shadcn components. Add new ones with `pnpm dlx shadcn@latest add <name>`.
- Use the installed skills (Next.js, React, shadcn, Prisma) instead of guessing API details.
- Every new or changed endpoint is added to `docs/api.md` in the same step.
- Write every message and summary to the owner in Persian, in a few lines. Do not paste whole files into the summary.
- The owner only talks to you through prompts. Commit your work and push it to `main`; Vercel deploys from `main`. Push only when `pnpm check`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass. Never force push.
- Never write secrets (connection strings, passwords, tokens) into any file that is tracked, any summary, or any log. Never create default passwords; read them from `.env` only.

## Current phase: backend integration

The UI is finished and runs on an in-memory mock data layer. Build the real backend one feature per step.

- Follow the API rules below. Each endpoint: route handler, zod validation, service, repository. Authorization and scoping live in the service.
- Replace the body of each `features/<feature>/api.ts` with calls through `lib/http.ts`. Keep the exported function signatures and return shapes so the UI does not change. Delete that feature's mock data once its endpoints work.
- Change UI components only when real data requires a fix.
- Never send Prisma types to the client. Use the types in `features/<feature>/types.ts` and serialize BigInt and Date in `lib/api`.
- Add every endpoint to `docs/api.md`.
- Write Vitest tests for authorization, scoping and status transitions in services.
- The seed script creates base data (belts, age categories, weight classes), one admin from env vars, and a separate dev seed with realistic Persian demo data built from the former mock data.

Definition of done for every step: `pnpm check`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass; the affected flow is walked through in the browser against the real API; the summary is a few lines.

## Code style

- No comments in code. Add a comment only when it is truly necessary to explain a non-obvious reason, and write it in English.
- All identifiers, file names and code are in English. All user-facing text is in Persian.
- Biome is the single source of truth for formatting: 2 spaces, line width 140. Never fight the formatter.
- Prefer named exports. Use default exports only where Next.js requires them.
- Avoid `any`. Use `unknown` and narrow it.
- Use union types or `as const` objects instead of custom TypeScript enums. Prisma enums are fine.
- Keep functions short and flat. Use early returns. Avoid deep nesting and clever one-liners.

## Components

- One component does one job. If a component renders a list, a form and a dialog, split it.
- A component file stays under about 80 lines. Hard limit 150. If it grows, split it.
- Keep props small (about 5 or fewer). Pass only the data a component needs.
- No business logic in components. Put logic in hooks or services.
- Presentational components receive data through props. Data fetching lives in a hook or in one small container component.
- Split by responsibility, not by line count. Do not create wrappers around a single element.
- UI not tied to a feature goes in `src/components/`. Everything tied to a feature stays inside that feature.

## Folder structure

```
src/
  app/                      routes only, thin files
    (auth)/login/
    (admin)/admin/...
    (coach)/coach/...
    api/v1/...              route handlers, thin
  features/
    <feature>/
      components/           UI for this feature, one job each
      hooks/                SWR hooks and UI logic
      server/               service.ts and repository.ts, framework independent
      schemas.ts            zod schemas shared by client and server
      types.ts
      index.ts              public exports of the feature
  components/
    ui/                     shadcn components
    layout/                 shell, sidebar, page header
    shared/                 empty state, confirm dialog, data table, status badge
  lib/
    api/                    route handler wrapper, response helpers, AppError
    storage/                file storage interface and local implementation
    prisma.ts
    session.ts
    env.ts                  zod-parsed environment variables
    http.ts                 client fetcher
    format.ts               money, Jalali dates, Persian digits
  generated/                Prisma client output
prisma/
  schema.prisma
  seed.ts
  data/
docs/
  api.md
  DESIGN.md
design/                     reference screenshots, not code
```

Features: `auth`, `users`, `students`, `competitions`, `registrations`, `payments`, `base-data`.

Import rules:

- A feature imports from other features only through their `index.ts`.
- `app/` imports from `features/` and `components/`. Never the reverse.
- `features/*/server` and `lib/api` core never import React or `next/*`.

## API rules (the backend must be portable)

The backend lives in Next.js now and will move to NestJS or Express later. Build it as a real REST API so that the move is mostly copying files.

- All data goes through REST route handlers under `src/app/api/v1`. Never use Server Actions. Never fetch data inside server components by calling services directly. Pages call the API through SWR hooks.
- Resource-oriented URLs: plural nouns, kebab-case, HTTP verbs for actions. Examples: `GET /api/v1/students`, `POST /api/v1/competitions/:id/registrations`, `PATCH /api/v1/payments/:id`.
- A route handler does four things only: build the current user from the request, validate input with the feature's zod schema, call one service function, return JSON. No business logic, no Prisma.
- Route handlers use the standard Web `Request` and `Response`. Avoid `next/headers`, `cookies()` and `NextResponse` features outside `lib/api` and `lib/session.ts`, so only those files change during migration.
- The current user comes only from `getCurrentUser(request)` in `lib/session.ts`, which verifies a signed session cookie. Never trust identity headers such as `x-user-id`.
- Services are plain TypeScript. They receive an `AuthUser` plain object and validated input, and return plain data. They throw `AppError(code, message, status)` for expected failures.
- Repositories contain all Prisma queries. Services never call Prisma directly.
- Services enforce authorization and scoping themselves: `ADMIN` only touches data of their own province, `COACH` only touches their own students, registrations and payments.
- Response shape: success `{ data }`, lists `{ data, meta: { page, pageSize, total } }`, errors `{ error: { code, message, details? } }` with the correct HTTP status. User-facing messages are Persian.
- BigInt and Date values are serialized as strings (ISO for dates) in one place in `lib/api`.
- File uploads go through `Request.formData()` and a `Storage` interface in `lib/storage`. The first implementation stores files in PostgreSQL (a `StoredFile` model with `Bytes`), because Vercel has no persistent disk. Files are private and served through an authenticated endpoint.
- The browser talks to the API only through `lib/http.ts`. The base URL comes from `NEXT_PUBLIC_API_URL` (empty means same origin) so the API can move to another host later.
- Read environment variables only through `lib/env.ts`.
- Never log passwords, tokens or national codes.

## UI and UX rules

The interface must look like a real, hand-designed product, not generated output. Follow `docs/DESIGN.md` strictly. Short version:

- RTL everywhere. Use logical Tailwind classes (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`).
- Font: Vazirmatn. Persian digits for display.
- Modern and refined: soft app background, white cards with a hairline border and a very soft shadow, a dark navy sidebar, one blue accent, generous but consistent spacing, avatars and belt chips that carry real meaning.
- No glassmorphism, no neon, no purple or violet, no emoji, no stock illustrations, no marketing copy inside the app, no fake charts. A gradient is allowed only on the login brand panel.
- Admin screens are desktop-first and data-dense. Coach screens are mobile-first. Test both widths.
- Every list has loading (skeleton shaped like the content), empty (one sentence and one action) and error (with retry) states. Every mutation reports success or failure.
- Forms: labels above inputs, inline errors under the field, one primary button per view, destructive actions behind a confirm dialog.
- Use realistic Persian content and data. Never lorem ipsum or English placeholder names.
- After finishing UI work, review the result against the checklist in `docs/DESIGN.md`. If you can run the app and take screenshots, check 1440px and 390px widths.

## Hosting (Vercel, serverless)

- The app is deployed on Vercel from `main` with Neon PostgreSQL. A failed build never replaces the live version, so fix the build before anything else.
- No writes to the local file system and no state in memory that must survive between requests (sessions, rate limits, uploads). Use the database.
- Environment variables live in Vercel project settings. At runtime the app needs only `DATABASE_URL`. `DATABASE_URL` is the direct Neon connection string (host without `-pooler`); it is used by the app, by `prisma migrate deploy`, and to derive the session signing key. `SESSION_SECRET` is optional and overrides the derived key when set. `DIRECT_URL` is optional and is used by the Prisma CLI only if set. `ADMIN_*` variables are only for seeding.
- `prisma generate` must run during install or build so deployment works.
- Request bodies are limited to about 4.5MB. Receipt images are compressed in the browser to under 1MB before upload, and the server rejects files over 2MB and non-image types.
- The build script is `prisma generate && prisma migrate deploy && next build`. It applies pending migrations on every deploy. Never put seed scripts in the build.
- Every schema change comes with a migration file committed in `prisma/migrations`. Never edit an applied migration. Never run `prisma migrate reset` or `prisma db push` on the shared database.

## Testing

- Write Vitest tests for pure business logic: eligibility (age, belt, gender, weight class) and status transitions.
- Do not write tests for simple UI.

## Git

- Small commits, one per finished step or logical unit. Message format: `feat(students): add student list`.
- Never commit `.env` or uploaded files.
- Secrets such as connection strings come from the environment configured by the owner (local `.env`, the agent environment and Vercel project settings), never from prompts or files in the repository.

## Out of scope for the MVP

Counties, super admin, delegates, profile and document approval, student transfers, deadline extensions, refunds, notifications, audit log, payment gateway, match day management, dark mode. Do not build them unless a step explicitly asks.

# API conventions

All API routes live under `src/app/api/**/route.ts` and return the same JSON envelope.

## Base URL

- The browser calls `NEXT_PUBLIC_API_URL` when it is set.
- When `NEXT_PUBLIC_API_URL` is empty, requests go to the same origin (Next.js route handlers).
- Filter, sort and page state should live in the query string, not in the body.

## Success response

```json
{ "ok": true, "data": { "id": "cmp_1", "title": "مسابقات کشوری" } }
```

`data` is the payload. Use a plain object or array, never a second envelope.

## Error response

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "کد ملی باید ۱۰ رقم باشد.",
    "details": [{ "path": ["nationalId"], "message": "کد ملی باید ۱۰ رقم باشد." }]
  }
}
```

- `message` is Persian, says what is wrong and what to do, and is safe to show.
- `details` is optional and only for form or field errors.
- Never return raw exception text or stack traces.

## Status and error codes

| Status | Code               | When                                            |
| ------ | ------------------ | ----------------------------------------------- |
| 400    | `VALIDATION_ERROR` | Zod rejected the body or query                  |
| 400    | `INVALID_JSON`     | The request body is not valid JSON              |
| 400    | `INVALID_FORM`     | The multipart body could not be parsed          |
| 400    | `INVALID_FILE`     | The uploaded receipt file is empty              |
| 400    | `INVALID_FILE_TYPE` | The uploaded file signature is not a JPEG/PNG/WebP image |
| 400    | `FILE_TOO_LARGE`   | The uploaded receipt is over 2MB                |
| 400    | `INVALID_PASSWORD` | Password change with a wrong current password   |
| 401    | `UNAUTHORIZED`     | No current user on a protected route            |
| 401    | `INVALID_CREDENTIALS` | Login with a wrong mobile or password        |
| 403    | `FORBIDDEN`        | The user may not perform this action            |
| 403    | `USER_INACTIVE`    | The account is inactive and cannot be used      |
| 404    | `NOT_FOUND`        | The record does not exist                       |
| 409    | `CONFLICT`         | Duplicate or state conflict                     |
| 413    | `PAYLOAD_TOO_LARGE` | The request body is larger than the declared upload limit |
| 429    | `TOO_MANY_ATTEMPTS` | Login is temporarily locked after repeated failures |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; details are logged, not sent |
| 503    | `SERVICE_UNAVAILABLE` | Health check failed; the database is slow or unreachable |

Domain routes throw `AppError` and let the wrapper map it:

```ts
import { AppError } from "@/lib/api";

throw new AppError(404, "NOT_FOUND", "مسابقه پیدا نشد.");
```

## Authentication

- `POST /api/v1/auth/login` with `{ mobile, password }` returns `{ id, role, fullName, province }` and sets the session cookie. Wrong credentials return `401 INVALID_CREDENTIALS`; an inactive account returns `403 USER_INACTIVE`.
- `POST /api/v1/auth/logout` clears the session cookie.
- `GET /api/v1/auth/me` returns the current user's profile and returns `401` when the cookie is missing or invalid.
- `POST /api/v1/auth/password` with `{ currentPassword, newPassword }` lets any logged-in user change their own password. A wrong current password returns `400 INVALID_PASSWORD`; a successful change returns `{ data: null }`.

### Login rate limiting

Failed login attempts are stored in the database (the `login_failures` table), so the limit works on serverless where memory does not survive between requests. Every failure is recorded twice: once under the normalized mobile and once under the SHA-256 hash of the client IP (peppered with `SESSION_SECRET` or `DATABASE_URL`; the plain IP is never stored). When either key reaches 5 failures inside a sliding 15 minute window, every login for that mobile or that IP returns `429 TOO_MANY_ATTEMPTS` with the Persian message «به دلیل تلاش های ناموفق مکرر، ورود موقتا مسدود شده است. ۱۵ دقیقه دیگر دوباره تلاش کنید.» even with correct credentials. A successful login clears the failures of its own keys and every failure prunes rows older than the window, so the table stays tiny.

The session is a signed JWT (jose, HS256) in an HttpOnly cookie named `nabard_session`, `Secure` and `SameSite=Lax` in production. The signing key is `SESSION_SECRET` when set, otherwise it is derived from `DATABASE_URL`. The current user comes only from `getCurrentUser(request)` in `lib/session.ts`; identity headers from the client such as `x-user-id` are never trusted. Use `requireUser(request, ...roles)` for guards outside the wrapper.

The proxy (`src/proxy.ts`) redirects a visitor without a valid session to `/login` and sends each role to its own section (`/admin`, `/coach` or `/super`). It is an optimistic redirect; the routes and services still enforce authorization themselves.

### Roles

- `ADMIN` — a province admin. Always has a `province`; manages coaches, competitions, registrations, payments and refunds of their own province, and decides student transfers and coach reassignments within it.
- `COACH` — belongs to a province and one of its counties; manages their own students and registrations and can request another coach's student of the same province into their own club.
- `SUPER_ADMIN` — the super admin (ادمین کل). Has no `province` and works in `/super`: manages province admins and the age category dates, sees cross-province read-only lists (including the counties of all provinces), and never performs decision actions. `province` is required for `ADMIN` and `COACH` and stays `null` for `SUPER_ADMIN` (enforced in the services).


## Health

- `GET /api/v1/health` needs no session. It runs `SELECT 1` on the database with a 3 second timeout and returns `{ status: "ok", database: "up" }` on success or `503 SERVICE_UNAVAILABLE` with a Persian message when the database is slow or unreachable. It is safe for uptime monitors and leaks nothing about the infrastructure.

## Security headers

Every response (pages and API) carries `Content-Security-Policy` (`default-src 'self'`, inline styles allowed for Next.js, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` and a minimal `Permissions-Policy`. The receipt endpoint additionally serves its image with `Content-Disposition: inline` and `nosniff`.

## Coaches

Admins manage the coaches of their own province; a `COACH` session gets `403 FORBIDDEN`. A `SUPER_ADMIN` session has read-only access to the coach list and details of every province. Every coach always belongs to one county of the admin's province; ADMIN users have no county.

- `GET /api/v1/coaches?search=&status=active|inactive&province=&page=&pageSize=` returns `{ data: User[], meta: { page, pageSize, total } }`. `province` is only honored for a `SUPER_ADMIN` session (all provinces when omitted). `User` carries `countyId` and `countyName`. `search` matches full name or mobile, `status` filters `isActive`, `page` defaults to 1 and `pageSize` to 100 (max 100).
- `POST /api/v1/coaches` with `{ fullName, mobile, nationalCode, initialPassword, countyId }` creates an active coach in the admin's province. `countyId` must reference a county of the admin's province (`400 VALIDATION_ERROR` with «شهرستان انتخاب شده معتبر نیست.» otherwise). The initial password is hashed with bcryptjs; password hashes are never returned or logged. A duplicate mobile or national code returns `409 CONFLICT`.
- `GET /api/v1/coaches/:id` returns one coach. A coach of another province returns `404 NOT_FOUND`.
- `PATCH /api/v1/coaches/:id` accepts any subset of `{ fullName, mobile, nationalCode, isActive, countyId }` and returns the updated coach. A `countyId` must belong to the admin's province. An empty body is a validation error.
- `POST /api/v1/coaches/:id/reset-password` (admin only, own province) with `{ password }` (at least 8 characters) sets a new password for the coach. The password is hashed with bcryptjs and never returned; the plain value is never logged. A coach of another province or an admin account returns `404 NOT_FOUND`.

### Coach county change requests

A coach moves between the counties of their province only through an admin decision; registrations, students and payments are never touched — approval changes only the coach county.

- `GET /api/v1/coaches/me/county-change` (coach only) returns the coach's latest county change request or `null`.
- `POST /api/v1/coaches/me/county-change` (coach only) with `{ toCountyId }` creates a `PENDING` request from the coach's current county. `toCountyId` must be a county of the coach's province (`400` otherwise) and different from the current county (`400`). A coach who already has a `PENDING` request gets `409 CONFLICT` with «یک درخواست تغییر شهرستان در انتظار بررسی دارید.»
- `GET /api/v1/county-change-requests?status=PENDING|APPROVED|REJECTED&page=&pageSize=` (admin only) returns `{ data, meta }` — the requests of the coaches of the admin's province, newest first, each row `{ id, coachId, coachName, fromCountyId, fromCountyName, toCountyId, toCountyName, status, note, decidedAt, createdAt }`.
- `POST /api/v1/county-change-requests/:id/approve` (admin of the same province) approves a `PENDING` request. In one transaction the request moves to `APPROVED` (conditional update, so a double decision returns `409 CONFLICT` with «این درخواست قبلا بررسی شده است.») and the coach's `countyId` is set to `toCountyId`.
- `POST /api/v1/county-change-requests/:id/reject` (admin of the same province) with `{ note }` (required, 3 to 500 characters) rejects the request under the same one-time guard and stores the note.

## Students

A coach manages only their own students. An admin can read the students of the coaches of their own province (list and detail) and cannot write them; a `SUPER_ADMIN` session can read the list and detail across provinces. The student province comes from the owning coach.

Every student carries a profile status (`PENDING`, `APPROVED`, `REJECTED`; new students start `PENDING`) with an optional rejection note, the reviewing admin id and the approval time. A student can only be registered in a competition when the profile is `APPROVED`; the eligibility check rejects unapproved students with «پروفایل هنرجو هنوز تایید نشده است». Editing the full name, the national code, the birth date or the belt of an `APPROVED` student moves the profile back to `PENDING`; editing the weight (or a no-op save) does not. Required documents for the approval are `PHOTO` and `NATIONAL_ID_OR_BIRTH_CERTIFICATE`; `INSURANCE` and `BELT_CERTIFICATE` are optional. Documents are private images stored like receipts (JPEG/PNG/WebP, max 2 MB, browser-compressed) with one document per type: uploading again replaces the image.

- `GET /api/v1/students?search=&beltId=&gender=MALE|FEMALE&coachId=&province=&page=&pageSize=` returns `{ data: Student[], meta: { page, pageSize, total } }`. A `COACH` session always lists only its own students and `coachId` is ignored; an `ADMIN` session lists the students of the coaches of their province, optionally filtered by `coachId`. A `SUPER_ADMIN` session lists across provinces, optionally filtered by `province`. `search` matches full name or national code, `beltId` filters by belt, `page` defaults to 1 and `pageSize` to 100 (max 100).
- `POST /api/v1/students` (coach only) with `{ fullName, gender, nationalCode, birthDate, beltId, weightKg }`. The national code is normalized from Persian digits and validated with the Iranian checksum; a wrong code returns `400 VALIDATION_ERROR` with a Persian message and a duplicate returns `409 CONFLICT`. `birthDate` must be an ISO date in the past. `weightKg` is optional (`null` allowed), positive with at most one decimal. `beltId` must reference an existing belt (`400 VALIDATION_ERROR` otherwise). The student is always created under the session coach; `coachId` in the body is ignored.
- `GET /api/v1/students/:id` returns one student as `{ ...Student, coachName, documents: [{ id, studentId, type, fileId, createdAt }] }`. A student outside the caller scope (another coach, or a coach of another province for an admin) returns `404 NOT_FOUND`.
- `PATCH /api/v1/students/:id` (coach only) accepts any subset of `{ fullName, gender, nationalCode, birthDate, beltId, weightKg }` and returns the updated student. An empty body is a validation error. A national code that belongs to another student returns `409 CONFLICT`. Changing the full name, the national code, the birth date or the belt of an `APPROVED` student resets `profileStatus` to `PENDING`.
- `DELETE /api/v1/students/:id` (coach only) deletes the student and returns `{ id }`. A student that has registrations cannot be deleted and returns `409 CONFLICT` with a Persian message.
- `PUT /api/v1/students/:id/documents/:type` (owning coach only) with `multipart/form-data` and one `file` image uploads or replaces the document of that type (`PHOTO`, `NATIONAL_ID_OR_BIRTH_CERTIFICATE`, `INSURANCE`, `BELT_CERTIFICATE`). The file rules match receipts: `400 INVALID_FILE_TYPE` / `400 FILE_TOO_LARGE` / `400 INVALID_FILE`, and `413 PAYLOAD_TOO_LARGE` for an oversized request body. An unknown type or a foreign student returns `404 NOT_FOUND`.
- `GET /api/v1/students/:id/documents/:type/file` (owning coach, or an admin of the same province) serves the stored image inline with `Cache-Control: private, no-cache` and `X-Content-Type-Options: nosniff`. Missing document or out-of-scope access returns `404 NOT_FOUND`.
- `DELETE /api/v1/students/:id/documents/:type` (owning coach only) deletes the document row and the stored file; `404` when there is nothing to delete.
- `GET /api/v1/students/pending-review?status=PENDING|REJECTED&page=&pageSize=` (admin only) returns `{ data, meta }` — the students of the admin's province whose profile is `PENDING` or `REJECTED` (newest change first), each row with the student fields, `coachName` and the uploaded `documents`. A coach session gets `403 FORBIDDEN`.
- `POST /api/v1/students/:id/approve` (admin of the same province) approves a `PENDING` or `REJECTED` profile, clears the note and stamps the admin id and approval time in one conditional update inside a transaction, so an already approved profile can never be approved twice (`409 CONFLICT` with «این پروفایل قبلا بررسی شده است.»). Out-of-province students return `404 NOT_FOUND`.
- `POST /api/v1/students/:id/reject` (admin of the same province) with `{ note }` (required, 3 to 500 characters) rejects the profile and stores the note; same conditional one-time transition and scoping as approve.

## Student transfers

A coach can request a student of another coach of the same province into their own club; the admin of the province decides. Cross-province transfers are blocked for now with «انتقال هنرجو بین استان ها فعلا امکان پذیر است.» — a later step will handle them. Every request keeps its full history: rows are never deleted or rewritten, they only move from `PENDING` once (a double decision returns `409 CONFLICT` with «این درخواست قبلا بررسی شده است.»).

- `POST /api/v1/students/transfer-requests/lookup` (coach only) with `{ nationalCode }` looks a student up by their normalized national code and returns `{ maskedName, currentCoachName }` and nothing else. An unknown code returns `404 NOT_FOUND` with «هنرجویی با این کد ملی یافت نشد.», a student of the requester returns `409 CONFLICT` with «این هنرجو هم اکنون در باشگاه شما ثبت است.» and a student of another province returns `403 FORBIDDEN` with the cross-province message.
- `POST /api/v1/students/transfer-requests` (coach only) with `{ nationalCode }` creates a `PENDING` request from the student's current coach to the requester. The same lookup rules apply first; a student that already has a `PENDING` transfer returns `409 CONFLICT` with «یک درخواست انتقال در انتظار بررسی برای این هنرجو وجود دارد.»
- `GET /api/v1/transfer-requests?status=PENDING|APPROVED|REJECTED&page=&pageSize=` returns `{ data, meta }`. For an `ADMIN` session it lists the requests of their province (scoped by the previous coach's province), each row `{ id, studentId, studentName, fromCoachId, fromCoachName, toCoachId, toCoachName, status, note, decidedAt, createdAt }`. For a `COACH` session it lists the requests where the coach is the requester (full row, `direction: "incoming"`) or the previous coach — the old coach sees only `status`, the new coach's name (`toCoachName`) and nothing about the student (`studentName` and `note` are `null`, `direction: "outgoing"`). A `SUPER_ADMIN` session gets `403 FORBIDDEN`.
- `POST /api/v1/transfer-requests/:id/approve` (admin of the same province) approves a `PENDING` request inside one transaction: a conditional update moves the request to `APPROVED` and another conditional update sets `student.coachId` to the requesting coach only while the student still belongs to the previous coach — if the ownership changed in the meantime the transaction rolls back with `409 CONFLICT` and «مالکیت این هنرجو تغییر کرده است و درخواست قابل تایید نیست.» Approving changes only the student's coach: existing registrations, payments, refunds, the profile status and the documents stay exactly as they are with the previous coach.
- `POST /api/v1/transfer-requests/:id/reject` (admin of the same province) with `{ note }` (required, 3 to 500 characters) rejects the request under the same one-time guard and stores the note.
- `POST /api/v1/coaches/:id/reassign-students` (admin of the same province) with `{ toCoachId }` moves all students of a coach to another active coach of the same province in one transaction and returns `{ moved }`. It is meant for deactivated coaches and never touches registrations, payments or refunds; a target of another province or an inactive target returns `400 VALIDATION_ERROR` with a Persian message.

## Counties

Counties (شهرستان) belong to one province. The admin of a province manages its counties; coaches and super admins read them. The base seed holds the official list of the Tehran province counties and `default-counties.ts` holds a default list of every province.

- `GET /api/v1/counties` (any logged-in user) returns `{ data: [{ id, province, name }] }` — the counties of the caller's province, ordered by name. A `SUPER_ADMIN` session receives all provinces, optionally filtered by `?province=`.
- `POST /api/v1/counties` (admin only) with `{ name }` creates a county in the admin's province (a `province` in the body is ignored). A duplicate name within the province — compared after normalizing Arabic ye/kaf and zero-width non-joiners — returns `409 CONFLICT` with «این شهرستان در این استان قبلا ثبت شده است.»
- `PATCH /api/v1/counties/:id` (admin of the same province) with `{ name }` renames the county; the province never changes and another province's county is `404 NOT_FOUND`.
- `DELETE /api/v1/counties/:id` (admin of the same province) deletes a county. When any coach, competition or county change request still references it, the delete is blocked with `409 CONFLICT` and «این شهرستان به مربی یا مسابقه ای متصل است و قابل حذف نیست.»
- `POST /api/v1/counties/defaults` (admin only) inserts the default counties of the admin's province that do not exist yet (compare by name after normalizing Persian characters such as Arabic ye and kaf and zero-width non-joiners) and returns `{ added }`. It never renames or deletes anything, and repeating it adds nothing.

A `SUPER_ADMIN` session has no write access to counties (`403 FORBIDDEN`).

## Competitions

Admin-only management with province scoping; coaches get a read-only view. The province of a competition always comes from the session admin; `province` and `status` in the body are ignored.

Every competition carries a `level`: `PROVINCIAL` (visible and open to all coaches of the province) or `COUNTY` with one or more counties (`countyIds`) of the competition's province, stored in the `competition_counties` table (unique pair, no duplicates). A county competition is visible in the coach list only to coaches whose county is one of the listed counties; a coach of another county gets `404 NOT_FOUND` on its details and `403 FORBIDDEN` on registration, and the eligible-student count respects the same rule because the competition never reaches the coach's list. The admin sees every competition of the province with all selected counties (`countyIds` and `countyNames`) shown. Level and the county list are locked once registrations exist (the competition is not editable at all then); the edit lock and deadline extension rules are unchanged.

- `GET /api/v1/competitions?status=&discipline=&province=&search=&page=&pageSize=` returns `{ data, meta }`. A `SUPER_ADMIN` session returns the competitions of all provinces (optionally filtered by `province`) with the same shape as the admin list, without coach decoration. For an `ADMIN` session it returns the competitions of their own province with optional `status`, `discipline` and `search` (title) filters. For a `COACH` session it returns only `PUBLISHED` competitions of their own province that are `PROVINCIAL` or list the coach's county (any requested `status` is ignored), sorted by nearest deadline, and every item carries a computed `state` and `eligibleStudentCount`. `state` is `NOT_YET_OPEN` before the registration opening, `OPEN` until the deadline and `CLOSED` after it; `eligibleStudentCount` counts the coach's own students that pass the eligibility check against the competition's frozen rules snapshot (published competitions) or the live base data (drafts). Every competition row carries `ageCategoryLabel` (from the snapshot when it exists, otherwise the live label) and `rules` (the frozen snapshot, `null` for drafts).
- `POST /api/v1/competitions` (admin only) with `{ title, discipline, gender, ageCategoryId, beltIds, level, countyIds?, feePerStudent, payeeCardNumber, payeeCardHolder, registrationDeadline, eventDate }` creates a `DRAFT` in the admin's province. `level` is `PROVINCIAL` or `COUNTY`; a county competition requires at least one county of the admin's province (`400 VALIDATION_ERROR` otherwise, duplicates are dropped) while a provincial competition always stores an empty county list. `feePerStudent` is a positive integer in rials (Persian digits normalized), `payeeCardNumber` must be 16 digits, `payeeCardHolder` is required, the deadline must be before the event date, every belt id and the age category must exist, the minimum belt level must not exceed the maximum belt level, and a kyorugi competition requires weight classes for its age category and gender (poomsae needs none).
- `GET /api/v1/competitions/:id` returns one competition with `level`, `countyIds` and `countyNames`. A `SUPER_ADMIN` session sees any competition. A coach never sees drafts (`404`) and never sees a county competition whose county list excludes their county (`404`); everything outside the caller province is `404 NOT_FOUND`. Coach responses also carry `state` and `eligibleStudentCount`.
- `PATCH /api/v1/competitions/:id` (admin only) accepts any subset of the create fields including `level` and `countyIds`. A competition that has registrations cannot be edited and returns `409 CONFLICT` with a Persian message — level and the county list are locked with the rest. The merged result is re-validated: a county competition needs at least one county of the province, and moving back to `PROVINCIAL` clears the county list.
- `POST /api/v1/competitions/:id/publish` (admin only) moves a `DRAFT` to `PUBLISHED` and, in the same transaction, freezes the rules snapshot (`rulesSnapshot`: age category, min and max belt, weight classes of the age category and gender). It fails with `409` when the competition is already published or canceled (a canceled competition is never republished) and with `400` when any field is invalid or the registration deadline is already past.
- `POST /api/v1/competitions/:id/cancel` (admin only) with `{ reason }` (required, 3 to 500 characters) moves a `PUBLISHED` competition to `CANCELED` and stores the reason as `cancelReason`. In one transaction the server also creates a `PENDING` refund (amount = the competition fee per student) for every registration whose payment is `CONFIRMED`, or `PENDING` (receipt uploaded but not reviewed yet — those refunds carry the note «پرداخت بررسی نشده بود؛ قبل از بازپرداخت دریافت وجه را تأیید کنید»), and that is not already refunded; the refunds go to the paying coach and registrations with a `REJECTED` receipt never get one. Canceling a draft or an already canceled competition returns `409`, and the conditional update applies the cancel and the refunds at most once.
- `POST /api/v1/competitions/:id/extend` (admin only, own province) extends the registration deadline with `{ newDeadline (ISO), reason (required, 3 to 500 characters), reopenForRejected? }`. A canceled competition cannot be extended (`409`), the new deadline must be after the current one and before the event date (`400` otherwise), and a coach session gets `403`. In one transaction the endpoint stores a `DeadlineExtension` row with `previousDeadline`, `newDeadline`, `reopenForRejected`, `reason` and the admin id, and updates the competition deadline — coaches see the new deadline and countdown without any further call. Once registrations exist this extension is the only allowed change to the deadline (`PATCH` is already blocked for competitions with registrations). The response is the updated competition.
- `GET /api/v1/competitions/:id/extensions` (admin only, own province) returns the extension history of the competition, newest first: `{ data: [{ id, previousDeadline, newDeadline, reopenForRejected, reason, createdByName, createdAt }] }`. A coach session gets `403`; a competition outside the province or an unknown id returns `404 NOT_FOUND`.

### Registrations uniqueness and reopen

The database keeps at most one non-rejected registration per `(competition, student)` through a partial unique index committed in a raw SQL migration (`unique on (competition_id, student_id) WHERE status <> 'rejected'` — the registration status column is the review status of this schema and there is no canceled registration state). A `REJECTED` row stays as history and is never edited; a new registration for the same student can then be created, so a rejected student can register again only when the latest deadline extension of the competition has `reopenForRejected = true` and was created after that rejection. Any active (`PENDING`/`APPROVED`) registration still blocks a new one, and the database index enforces the same rule if concurrent requests race.

### Participants export

Read-only export of the approved participants of one competition; no schema change behind it.

- `GET /api/v1/competitions/:id/participants` (admin only, own province) returns `{ data: Participant[] }` — every `APPROVED` registration of the competition with `{ registrationId, studentId, fullName, nationalCode, birthDate (ISO), beltLabel, weightClassLabel, coachName }`. `weightClassLabel` comes from the registration's snapshot columns (label, min and max weight copied from the competition rules at registration time), so later weight class edits never change the printed participants. Sorted by weight class order first and then by the student's Persian name (no weight class, e.g. poomsae, sorts last). A `COACH` session gets `403 FORBIDDEN`; a competition outside the admin's province or an unknown id returns `404 NOT_FOUND`.
- `GET /api/v1/competitions/:id/participants.csv` (admin only, same scoping) returns the same list as a CSV download. The body is `text/csv; charset=utf-8` with a UTF-8 BOM (so Excel renders Persian correctly), CRLF rows, a Persian header row (`نام و نام خانوادگی, کد ملی, تاریخ تولد, کمربند, رده وزنی, نام مربی`) and Jalali birth dates. `Content-Disposition: attachment` carries a safe ASCII filename plus an RFC 5987 `filename*=UTF-8''` name derived from the competition title (control characters, quotes and path separators are stripped). CSV injection is neutralized only in user-entered text cells (student and coach names, national code): a cell that starts with `=`, `+`, `-` or `@` gets a single quote prefix. Cells coming from base data (belt, weight class, Jalali date) are written without the prefix, and the weight class keeps its base-data label with a leading hyphen-minus replaced by the Unicode minus sign (U+2212) so spreadsheet apps do not read it as a formula. Any cell containing commas, quotes or newlines is quoted per RFC 4180. The response is `Cache-Control: private, no-store` because it carries national codes.

## Registrations

Coach-only creation with server-side enforcement; both roles can read.

- `POST /api/v1/competitions/:id/registrations` (coach only) with `multipart/form-data`: one `receipt` image file and one or more `studentIds` fields. In one database transaction the server re-checks everything and creates one `PENDING` Payment (`amount = fee x count`) plus one `PENDING` Registration per student linked to that payment; the receipt is stored as a `StoredFile` and referenced by `Payment.receiptKey`. Returns `{ payment, registrations }`. Failure rules:
  - Only the coach's own students are allowed; anything else is `403 FORBIDDEN`.
  - A county competition accepts only coaches whose county is in the competition's county list; another county gets `403 FORBIDDEN` with «ثبت نام در این مسابقه فقط برای مربیان شهرستان های برگزار کننده امکان پذیر است.»
  - The competition must be `PUBLISHED` and inside its registration window (opening until the deadline); otherwise `409 CONFLICT`.
  - Eligibility is re-checked on the server for every student with the shared eligibility function (gender, age category, belt range, and the kyorugi weight class resolved from the declared weight). One ineligible student rejects the whole request with `400 VALIDATION_ERROR` and `details: [{ studentId, fullName, reason }]` with Persian reasons.
  - Any registration for a student in the same competition blocks the request with `409 CONFLICT` and the same per-student `details` shape: an active (`PENDING`/`APPROVED`) registration always blocks, while a `REJECTED` registration blocks unless the latest deadline extension reopened for rejected students and was created after that rejection (the rejected row itself is never edited and stays as history).
  - The receipt must be a real JPEG, PNG or WebP image up to 2MB, verified by file signature and not only by the declared type; otherwise `400 INVALID_FILE_TYPE`, `400 FILE_TOO_LARGE` or `400 INVALID_FILE`. A multipart body whose declared `Content-Length` is over 2MB + 128KB returns `413 PAYLOAD_TOO_LARGE` before parsing.
  - A malformed multipart body returns `400 INVALID_FORM`, a missing `receipt` field `400 VALIDATION_ERROR`.
- `GET /api/v1/registrations?competitionId=&paymentId=&status=PENDING|APPROVED|REJECTED&coachId=&province=&page=&pageSize=` returns `{ data, meta }`. A `COACH` session always lists only its own registrations and `coachId` is ignored; an `ADMIN` session lists the registrations of the coaches of their own province, optionally filtered by `coachId`; a `SUPER_ADMIN` session lists across provinces, optionally filtered by `province`. Sorted by newest first. Every row embeds `student: { id, fullName, beltId, weightKg }` so clients do not need a separate student lookup.
- `GET /api/v1/registrations/:id` returns the registration detail for the owning coach, a same-province admin or a `SUPER_ADMIN`; anything outside the caller scope is `404 NOT_FOUND`. The response carries `{ registration, competition: { id, title, registrationDeadline }, weightClassLabel, payment: { id, status, amount, createdAt }, bundle }` where `bundle` lists every registration of the same payment with `{ id, studentName, status, note }` — the payment status, each student's review status and the rejection notes.
- `POST /api/v1/registrations/:id/approve` (admin only, own province) approves a `PENDING` registration of a `CONFIRMED` payment. Each call runs one conditional update inside a transaction (`WHERE status = 'PENDING' AND payment.status = 'CONFIRMED'`), so concurrent or double requests apply the transition at most once. A second decision returns `409 CONFLICT` with «این ثبت نام قبلا بررسی شده است.»; an unconfirmed payment returns `409` with «برای بررسی ثبت نام، ابتدا رسید پرداخت باید تایید شود.»
- `POST /api/v1/registrations/:id/reject` (admin only, own province) with `{ note }` (required, 3 to 500 characters) rejects a `PENDING` registration of a `CONFIRMED` payment under the same one-time transaction guard. The note is stored and shown to the coach. Approved and rejected registrations can never change again. Rejecting a registration whose payment is `CONFIRMED` also creates a `PENDING` refund for that registration in the same transaction, with the competition fee per student as the amount; refunds always go to the paying coach, never the student.

## Payments

One payment covers the students of one registration batch. Receipts are private files served through an authenticated endpoint.

- `GET /api/v1/payments?status=PENDING|CONFIRMED|REJECTED&competitionId=&coachId=&province=&page=&pageSize=` returns `{ data, meta }`, sorted by newest first. A `COACH` session always lists only its own payments and `coachId` is ignored; an `ADMIN` session lists the payments of the coaches of their own province, optionally filtered by `coachId`; a `SUPER_ADMIN` session lists across provinces, optionally filtered by `province`.
- `GET /api/v1/payments/:id` returns one payment. A payment outside the caller scope (another coach, or a coach of another province for an admin) returns `404 NOT_FOUND`.
- `POST /api/v1/payments/:id/confirm` (admin only, own province) confirms a `PENDING` payment and clears the note. Each call runs one conditional update inside a transaction (`WHERE status = 'PENDING'`), so concurrent or double requests apply the transition at most once. A confirmed payment cannot be confirmed again («این پرداخت قبلا تایید شده است.») and a rejected payment cannot be confirmed until the coach uploads a new receipt («این پرداخت رد شده است؛ پس از بارگذاری رسید جدید قابل تایید است.»), both `409 CONFLICT`.
- `POST /api/v1/payments/:id/reject` (admin only, own province) with `{ note }` (required, 3 to 500 characters) rejects a `PENDING` payment and stores the note shown to the coach. The registrations of a rejected payment stay `PENDING` so the coach can upload a new receipt. Rejecting a confirmed payment returns `409` with «این پرداخت تایید شده و قابل رد کردن نیست.»; rejecting twice returns `409` with «این پرداخت قبلا رد شده است.»
- `GET /api/v1/payments/:id/receipt` returns the receipt image bytes (`image/jpeg`, `image/png` or `image/webp`) only to the owning coach, an admin of the same province or a `SUPER_ADMIN`; anyone else gets `404 NOT_FOUND`. The response carries `Cache-Control: private, no-cache`. A payment without a receipt (or with a missing file) returns `404 NOT_FOUND`.
- `PUT /api/v1/payments/:id/receipt` (coach only, owner) with `multipart/form-data` and one `receipt` image re-uploads the receipt of a `REJECTED` payment before the competition deadline; the payment returns to `PENDING` and its rejection note is cleared. The same file rules as registration apply (`400 INVALID_FILE_TYPE` / `400 FILE_TOO_LARGE` / `400 INVALID_FILE`, and `413 PAYLOAD_TOO_LARGE` for an oversized request body), and a non-rejected payment or a closed deadline returns `409 CONFLICT`.

## Refunds

Manual refunds recorded in the system. A `PENDING` refund row is created automatically in one transaction: when an admin rejects a registration whose payment is `CONFIRMED` (reason `REGISTRATION_REJECTED`), and when a competition is canceled (reason `COMPETITION_CANCELED`) for every registration whose payment is `CONFIRMED` or `PENDING` and that is not already refunded. Canceled-competition refunds of an unreviewed (`PENDING`) payment carry the note «پرداخت بررسی نشده بود؛ قبل از بازپرداخت دریافت وجه را تأیید کنید», which the admin refunds page shows. The amount always equals the competition fee per student and the money goes back to the paying coach, never the student; a `REJECTED` receipt never gets a refund. `registrationId` is unique, so a registration is refunded at most once.

- `GET /api/v1/refunds?status=PENDING|COMPLETED&page=&pageSize=` returns `{ data, meta }` sorted by newest first. An `ADMIN` session lists the refunds of the coaches of their own province with the optional status filter; a `COACH` session lists only its own refunds. Every row carries `{ id, registrationId, coachId, coachName, studentName, competitionId, competitionTitle, amount, reason, status, note, processedAt, createdAt }` with the amount as a string.
- `POST /api/v1/refunds/:id/complete` (admin only, own province) with `{ note? }` (optional, up to 500 characters) marks a `PENDING` refund as `COMPLETED` and stores the admin id, the processed time and the optional note in one conditional update (`WHERE status = 'PENDING'`), so a refund can never be completed twice; a second call returns `409 CONFLICT` with «این بازپرداخت قبلا ثبت شده است.» A coach session gets `403 FORBIDDEN` and a refund outside the admin's province returns `404 NOT_FOUND`.

## Base data

Belts, age categories and weight classes are editable base data owned by the super admin. Every row carries a stable unique `code` (set at creation, never changed), a unique Persian `label` and `isActive`; archived rows (`isActive: false`) keep serving old data (snapshots, registrations, student belts) but disappear from the default reads of `ADMIN` and `COACH`. Editing base data never changes a published competition or an existing registration: every non-draft competition freezes its rules in `rulesSnapshot` when it is published (age category `id`, `code`, `label`, `startDate`, `endDate`; min and max belt `id`, `code`, `label`, `level`; and the weight classes of its age category and gender with `id`, `label`, `min`, `max`, `excludeMin`, `excludeMax`, `order`). Eligibility, the coach eligible-student count, weight class resolution at registration and the participants export read the snapshot when it exists and the live data only for drafts. Registration rows carry `weightClassLabel`, `weightClassMin` and `weightClassMax` copied from the snapshot at registration time.

- `GET /api/v1/base-data` returns `{ belts, ageCategories, weightClasses }` (active rows only) for any logged-in user. Belts are ordered by level, age categories by start date, weight classes by category, gender and order. Forms use this endpoint.

### Belts (super admin only)

- `GET /api/v1/belts` returns the active belts; `?archived=true` (super admin only) includes the archived ones. Every belt: `{ id, code, label, level, order, rankType, color, colorHex, isActive }`.
- `POST /api/v1/belts` (super admin only) with `{ label, level, rankType, color?, colorHex?, code? }`. `label` and `level` must be unique (`409 CONFLICT` with a Persian message otherwise) and `code`, when sent, must be a unique lowercase slug; when omitted the server generates one. Writes the `belt.created` audit entry.
- `PATCH /api/v1/belts/:id` (super admin only) with any subset of `{ label, level, rankType, color, colorHex, isActive }`. Changing the level is allowed; duplicating another belt's label or level returns `409 CONFLICT`. `isActive: false` archives, `true` restores; the audit action distinguishes `belt.updated`, `belt.archived` and `belt.restored`.
- `DELETE /api/v1/belts/:id` (super admin only) deletes the belt only when no student profile and no competition (min or max belt) uses it; otherwise `409 CONFLICT` with «این کمربند در پروفایل هنرجوها یا مسابقه ها استفاده شده است و قابل حذف نیست؛ می توانید آن را بایگانی کنید.» Writes `belt.deleted`.

### Age categories (super admin only)

- `GET /api/v1/age-categories` returns the active categories; `?archived=true` includes the archived ones. Every category: `{ id, code, label, startDate, endDate, birthYearStart, birthYearEnd, isActive }`.
- `POST /api/v1/age-categories` (super admin only) with `{ label, startDate, endDate, code? }` (ISO dates). The end date must be after the start date and an active category must not overlap the range of another active one (`409 CONFLICT`, `details.field: "endDate"`); the Jalali `birthYearStart` and `birthYearEnd` are derived from the dates automatically. Writes `age_category.created`.
- `PATCH /api/v1/age-categories/:id` (super admin only) with any subset of `{ label, startDate, endDate, isActive }`. The same date and overlap rules apply; saving dates re-derives the birth years. Archived categories do not block overlaps. Writes `age_category.updated`, `age_category.archived` or `age_category.restored`.
- `DELETE /api/v1/age-categories/:id` (super admin only) deletes the category only when no competition references it and no registration points at one of its weight classes (its weight classes would be deleted with it); otherwise `409 CONFLICT` suggesting archiving. Writes `age_category.deleted`.

### Weight class sets (super admin only)

- `GET /api/v1/weight-class-sets?ageCategoryId=&gender=` returns the full ordered set (including archived rows, which keep the boundaries contiguous): `{ id, label, minWeightKg, maxWeightKg, order, excludeMin, excludeMax, isActive }`.
- `PUT /api/v1/weight-class-sets` (super admin only) with `{ ageCategoryId, gender, rows: [{ id?, label, minWeightKg, maxWeightKg, excludeMin, excludeMax }] }` replaces the set in one transaction. Validation (`400 VALIDATION_ERROR` with per-row `details`): at least one class, first `min` is `0`, rows sorted by `min` where each next `min` equals the previous `max`, on every shared boundary exactly one of the two classes includes it (`excludeMax` of the previous XOR `excludeMin` of the next), `max > min`, only the last class may have no `max`, labels unique in the set. Reconcile by `id`: existing rows are updated (and reactivated), rows without `id` are created, removed rows are deleted when no registration and no published competition snapshot references them and archived otherwise, so registrations keep pointing at their old row. Writes `weight_class_set.updated` with the created/updated/archived/deleted counts.

## Summary

- `GET /api/v1/summary` (admin only) returns the admin home dashboard for the admin's province in one query batch: `{ pendingPaymentsCount, openCompetitionsCount, weeklyRegistrationsCount, pendingRefundsCount, pendingProfilesCount, pendingCountyChangesCount, pendingTransfersCount, latestPendingPayments, upcomingCompetitions }`. `weeklyRegistrationsCount` counts registrations since the start of the current Jalali week (Saturday), `pendingRefundsCount` counts `PENDING` refunds, `pendingProfilesCount` counts `PENDING` student profiles of the province and `pendingCountyChangesCount` counts `PENDING` coach county change requests and `pendingTransfersCount` counts `PENDING` student transfers. `latestPendingPayments` are the five newest `PENDING` payments with `{ id, amount, createdAt, coachId, coachName }`; `upcomingCompetitions` are the five next `PUBLISHED` competitions by deadline with `{ id, title, discipline, registrationDeadline, registrationsCount }`. A coach session gets `403 FORBIDDEN`.

## Super admin

The super admin (ادمین کل) runs the `/super` section: province admins, base data and cross-province read-only views (competitions, coaches, counties, summary). Every endpoint in this section requires a `SUPER_ADMIN` session (`403 FORBIDDEN` otherwise) and never exposes decision actions: the super admin cannot create competitions, register students, confirm payments, approve registrations or decide refunds, and cannot write counties (county management moved to the province admins).

### Bootstrap script

`pnpm db:make-super-admin -- --mobile <mobile> --yes` promotes an existing user to `SUPER_ADMIN` and sets their `province` to `null`. Without `--yes` the script refuses to run. It prints only counts (`{"matched": n, "promoted": n}`) — never names, mobiles or tokens. The script is not part of the build or the seed.

### Audit log

Every schema-affecting action below writes an `AuditLog` row (`actorId`, `action`, `entityType`, `entityId`, `details`, `createdAt`). `details` carries no personal data (no names, mobiles or national codes): admin entries carry the province, county entries the province and county name (defaults entries the province and counts), and the age category entry the previous and next date range. Recorded actions: `admin.created`, `admin.activated`, `admin.deactivated`, `admin.password_reset`, `county.created`, `county.updated`, `county.deleted`, `county.defaults_added` (all county actions by a province admin), `age_category.dates_changed`, `transfer.requested` (by the requesting coach), `transfer.approved`, `transfer.rejected` (by the admin) and `students.reassigned`. Transfer entries carry the province only; the reassignment entry carries the province and the moved count.

### Province admins

- `GET /api/v1/admins?search=&status=active|inactive&page=&pageSize=` returns `{ data: AdminUser[], meta }` — all province admins, newest last, each row `{ id, mobile, fullName, role: "ADMIN", province, isActive, createdAt, updatedAt }`.
- `POST /api/v1/admins` with `{ fullName, mobile, initialPassword, province }` creates an active province admin with the given province. A duplicate mobile returns `409 CONFLICT`; the password is hashed with bcryptjs and never returned or logged.
- `GET /api/v1/admins/:id` returns one province admin; a non-admin user (coach or super admin) returns `404 NOT_FOUND`.
- `PATCH /api/v1/admins/:id` accepts any subset of `{ fullName, mobile, province, isActive }` and returns the updated admin. An empty body is a validation error. Activating and deactivating writes an audit entry; deactivating keeps all data and only blocks the next login.
- `POST /api/v1/admins/:id/reset-password` with `{ password }` (at least 8 characters) sets a new password for the province admin and writes an audit entry; the plain password is never logged.

### Super summary

- `GET /api/v1/super/summary` returns one row per province ordered like the `Province` enum: `{ province, admins, coaches, students, competitions, registrations, pendingPayments }`. `students`, `registrations` and `pendingPayments` are counted through the owning coach's province and `pendingPayments` counts `PENDING` payments only.

## Route handler wrapper

```ts
import { z } from "zod";
import { route } from "@/lib/api";

const bodySchema = z.object({ title: z.string().min(1) });

export const POST = route({ roles: ["ADMIN"], body: bodySchema }, async ({ user, body }) => {
  return { id: "cmp_1", title: body.title, createdBy: user.id };
});
```

The wrapper:

1. Reads the current user from the session cookie and rejects the request with `401` when `auth` is not `false` and there is no user, and with `403` when `roles` is set and the role does not match.
2. Parses the JSON body with the given Zod schema when `body` is set.
3. Passes `{ request, user, body }` to the handler. With `auth: false` the user may be `null`.
4. Wraps a returned value with `ok()`, or passes a returned `Response` through.
5. Maps `AppError` and `ZodError` to the error envelope. Any other error becomes `500 INTERNAL_ERROR`.

Query strings are read inside the handler with `new URL(request.url).searchParams`; validate them with Zod before use.

## Client fetcher

```ts
import { api, ApiError } from "@/lib/http";

try {
  const competitions = await api<Competition[]>("/api/competitions");
} catch (error) {
  if (error instanceof ApiError) {
    // error.status, error.code, error.message
  }
}
```

The fetcher sends JSON when a `body` is provided, unwraps `data`, and throws `ApiError` for every non-success response.

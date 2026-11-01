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
| 401    | `UNAUTHORIZED`     | No current user on a protected route            |
| 401    | `INVALID_CREDENTIALS` | Login with a wrong mobile or password        |
| 403    | `FORBIDDEN`        | The user may not perform this action            |
| 403    | `USER_INACTIVE`    | The account is inactive and cannot be used      |
| 404    | `NOT_FOUND`        | The record does not exist                       |
| 409    | `CONFLICT`         | Duplicate or state conflict                     |
| 500    | `INTERNAL_ERROR`   | Unexpected failure; details are logged, not sent |

Domain routes throw `AppError` and let the wrapper map it:

```ts
import { AppError } from "@/lib/api";

throw new AppError(404, "NOT_FOUND", "مسابقه پیدا نشد.");
```

## Authentication

- `POST /api/v1/auth/login` with `{ mobile, password }` returns `{ id, role, fullName, province }` and sets the session cookie. Wrong credentials return `401 INVALID_CREDENTIALS`; an inactive account returns `403 USER_INACTIVE`.
- `POST /api/v1/auth/logout` clears the session cookie.
- `GET /api/v1/auth/me` returns the current user's profile and returns `401` when the cookie is missing or invalid.

The session is a signed JWT (jose, HS256) in an HttpOnly cookie named `nabard_session`, `Secure` and `SameSite=Lax` in production. The signing key is `SESSION_SECRET` when set, otherwise it is derived from `DATABASE_URL`. The current user comes only from `getCurrentUser(request)` in `lib/session.ts`; identity headers from the client such as `x-user-id` are never trusted. Use `requireUser(request, ...roles)` for guards outside the wrapper.

The proxy (`src/proxy.ts`) redirects a visitor without a valid session to `/login` and sends each role to its own section (`/admin` or `/coach`). It is an optimistic redirect; the routes and services still enforce authorization themselves.

## Coaches

Admin-only. An admin sees and manages coaches of their own province only; a `COACH` session gets `403 FORBIDDEN`.

- `GET /api/v1/coaches?search=&status=active|inactive&page=&pageSize=` returns `{ data: User[], meta: { page, pageSize, total } }`. `search` matches full name or mobile, `status` filters `isActive`, `page` defaults to 1 and `pageSize` to 100 (max 100).
- `POST /api/v1/coaches` with `{ fullName, mobile, nationalCode, initialPassword }` creates an active coach in the admin's province. The initial password is hashed with bcryptjs; password hashes are never returned or logged. A duplicate mobile or national code returns `409 CONFLICT`.
- `GET /api/v1/coaches/:id` returns one coach. A coach of another province returns `404 NOT_FOUND`.
- `PATCH /api/v1/coaches/:id` accepts any subset of `{ fullName, mobile, nationalCode, isActive }` and returns the updated coach. An empty body is a validation error.

## Students

A coach manages only their own students. An admin can read the students of the coaches of their own province (list and detail) and cannot write them. The student province comes from the owning coach.

- `GET /api/v1/students?search=&beltId=&gender=MALE|FEMALE&coachId=&page=&pageSize=` returns `{ data: Student[], meta: { page, pageSize, total } }`. A `COACH` session always lists only its own students and `coachId` is ignored; an `ADMIN` session lists the students of the coaches of their province, optionally filtered by `coachId`. `search` matches full name or national code, `beltId` filters by belt, `page` defaults to 1 and `pageSize` to 100 (max 100).
- `POST /api/v1/students` (coach only) with `{ fullName, gender, nationalCode, birthDate, beltId, weightKg }`. The national code is normalized from Persian digits and validated with the Iranian checksum; a wrong code returns `400 VALIDATION_ERROR` with a Persian message and a duplicate returns `409 CONFLICT`. `birthDate` must be an ISO date in the past. `weightKg` is optional (`null` allowed), positive with at most one decimal. `beltId` must reference an existing belt (`400 VALIDATION_ERROR` otherwise). The student is always created under the session coach; `coachId` in the body is ignored.
- `GET /api/v1/students/:id` returns one student. A student outside the caller scope (another coach, or a coach of another province for an admin) returns `404 NOT_FOUND`.
- `PATCH /api/v1/students/:id` (coach only) accepts any subset of `{ fullName, gender, nationalCode, birthDate, beltId, weightKg }` and returns the updated student. An empty body is a validation error. A national code that belongs to another student returns `409 CONFLICT`.
- `DELETE /api/v1/students/:id` (coach only) deletes the student and returns `{ id }`. A student that has registrations cannot be deleted and returns `409 CONFLICT` with a Persian message.

## Base data

- `GET /api/v1/base-data` returns `{ belts, ageCategories, weightClasses }` for any logged-in user. Belts are ordered by level, age categories by name, weight classes by category, gender and order.

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

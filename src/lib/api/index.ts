import { ZodError, type ZodType, type z } from "zod";

export type CurrentUser = { id: string; role: string | null };

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getCurrentUser(request: Request): CurrentUser | null {
  const id = request.headers.get("x-user-id");
  return id ? { id, role: request.headers.get("x-user-role") } : null;
}

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data }, init);
}

export function fail(error: AppError): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    },
    { status: error.status },
  );
}

type BodyOf<TSchema> = TSchema extends ZodType ? z.infer<TSchema> : undefined;

export type RouteContext<TBody> = {
  request: Request;
  user: CurrentUser | null;
  body: TBody;
};

type RouteOptions<TSchema extends ZodType | undefined> = {
  auth?: boolean;
  body?: TSchema;
};

async function readBody<TSchema extends ZodType>(request: Request, schema: TSchema): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError(400, "INVALID_JSON", "بدنه درخواست JSON معتبر نیست.");
  }
  return schema.parse(raw);
}

export function route<TSchema extends ZodType | undefined = undefined, TResult = unknown>(
  options: RouteOptions<TSchema>,
  handler: (context: RouteContext<BodyOf<TSchema>>) => TResult | Promise<TResult>,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const user = getCurrentUser(request);
      if (options.auth !== false && !user) {
        throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
      }

      const body = options.body ? await readBody(request, options.body) : undefined;
      const result = await handler({ request, user, body: body as BodyOf<TSchema> });

      return result instanceof Response ? result : ok(result);
    } catch (error) {
      if (error instanceof AppError) return fail(error);
      if (error instanceof ZodError) {
        return fail(new AppError(400, "VALIDATION_ERROR", "ورودی نامعتبر است.", error.issues));
      }
      console.error(error);
      return fail(new AppError(500, "INTERNAL_ERROR", "خطای غیرمنتظره رخ داد."));
    }
  };
}

import { ZodError, type ZodType, type z } from "zod";
import { type CurrentUser, getCurrentUser, requireUser, type SessionRole } from "../session";
import { AppError } from "./app-error";

export { AppError };

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

type RouteContext<TBody, TUser> = {
  request: Request;
  user: TUser;
  body: TBody;
};

type RouteOptions<TSchema extends ZodType | undefined, TAuth extends boolean> = {
  auth?: TAuth;
  roles?: TAuth extends false ? never : SessionRole[];
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

export function route<TSchema extends ZodType | undefined = undefined, TResult = unknown, TAuth extends boolean = true>(
  options: RouteOptions<TSchema, TAuth>,
  handler: (context: RouteContext<BodyOf<TSchema>, TAuth extends false ? CurrentUser | null : CurrentUser>) => TResult | Promise<TResult>,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    try {
      const opts = options as { auth?: boolean; roles?: SessionRole[] };
      const user = opts.auth === false ? await getCurrentUser(request) : await requireUser(request, ...(opts.roles ?? []));

      const body = options.body ? await readBody(request, options.body) : undefined;
      const context = { request, user, body } as unknown as Parameters<typeof handler>[0];
      const result = await handler(context);

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

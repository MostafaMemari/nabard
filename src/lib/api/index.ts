import { ZodError, type ZodType, type z } from "zod";
import { type CurrentUser, getCurrentUser, requireUser, type SessionRole } from "../session";
import { AppError } from "./app-error";

export { AppError };

const jsonReplacer = (_key: string, value: unknown): unknown => (typeof value === "bigint" ? value.toString() : value);

export function ok<T>(data: T, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");

  return new Response(JSON.stringify({ ok: true, data }, jsonReplacer), { ...init, headers });
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

export async function readFormData(request: Request, options?: { maxBytes: number }): Promise<FormData> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (options && Number.isFinite(contentLength) && contentLength > options.maxBytes) {
    throw new AppError(413, "PAYLOAD_TOO_LARGE", "حجم درخواست بیش از حد مجاز است.");
  }

  try {
    return await request.formData();
  } catch {
    throw new AppError(400, "INVALID_FORM", "بدنه درخواست معتبر نیست.");
  }
}

type RouteContext<TBody, TUser> = {
  request: Request;
  user: TUser;
  body: TBody;
  params: Promise<Record<string, string>>;
};

type RouteOptions<TSchema extends ZodType | undefined, TAuth extends boolean> = {
  auth?: TAuth;
  roles?: TAuth extends false ? never : SessionRole[];
  body?: TSchema;
};

type HandlerArgs = { params?: Promise<Record<string, string>> };

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
): (request: Request, context?: HandlerArgs) => Promise<Response> {
  return async (request: Request, context?: HandlerArgs): Promise<Response> => {
    try {
      const opts = options as { auth?: boolean; roles?: SessionRole[] };
      const user = opts.auth === false ? await getCurrentUser(request) : await requireUser(request, ...(opts.roles ?? []));

      const body = options.body ? await readBody(request, options.body) : undefined;
      const params = context?.params ?? Promise.resolve({});
      const contextValue = { request, user, body, params } as unknown as Parameters<typeof handler>[0];
      const result = await handler(contextValue);

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

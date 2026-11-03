import { env } from "./env";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function api<T>(path: string, init: Omit<RequestInit, "body"> & { body?: unknown } = {}): Promise<T> {
  const { body, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");

  const baseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const result = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !result?.ok) {
    const error = result && !result.ok ? result.error : null;
    throw new ApiError(response.status, error?.message ?? "ارتباط با سرور برقرار نشد.", error?.code);
  }

  return result.data;
}

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

export function buildApiUrl(path: string): string {
  const baseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  return `${baseUrl}${path}`;
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function api<T>(path: string, init: Omit<RequestInit, "body"> & { body?: unknown } = {}): Promise<T> {
  const { body, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) requestHeaders.set("Content-Type", "application/json");

  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  const result = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !result?.ok) {
    const error = result && !result.ok ? result.error : null;
    throw new ApiError(response.status, error?.message ?? "ارتباط با سرور برقرار نشد", error?.code);
  }

  return result.data;
}

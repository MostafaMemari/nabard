import { createHash } from "node:crypto";
import { AppError } from "@/lib/api";
import { getServerEnv } from "@/lib/env";

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export type LoginThrottleRepository = {
  countLoginFailuresBy(keys: string[], since: Date): Promise<Record<string, number>>;
  recordLoginFailures(keys: string[], at: Date): Promise<void>;
  clearLoginFailures(keys: string[]): Promise<void>;
  pruneLoginFailures(before: Date): Promise<void>;
};

function tooManyAttempts(): AppError {
  return new AppError(429, "TOO_MANY_ATTEMPTS", "به دلیل تلاش های ناموفق مکرر، ورود موقتا مسدود شده است. ۱۵ دقیقه دیگر دوباره تلاش کنید.");
}

export function lockoutCount(counts: Record<string, number>): number {
  return Math.max(0, ...Object.values(counts));
}

export function isLockedOut(counts: Record<string, number>): boolean {
  return lockoutCount(counts) >= LOGIN_MAX_ATTEMPTS;
}

export function mobileThrottleKey(mobile: string): string {
  return `mobile:${mobile}`;
}

export async function ipThrottleKey(request: Request): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  const pepper = getServerEnv().SESSION_SECRET ?? getServerEnv().DATABASE_URL;
  const digest = createHash("sha256").update(`${ip}\n${pepper}`).digest("hex");

  return `ip:${digest}`;
}

export function loginThrottleKeys(mobile: string, ipKey: string): string[] {
  return [mobileThrottleKey(mobile), ipKey];
}

export async function assertCanLogin(repo: LoginThrottleRepository, keys: string[], now: Date): Promise<void> {
  const counts = await repo.countLoginFailuresBy(keys, new Date(now.getTime() - LOGIN_WINDOW_MS));
  if (isLockedOut(counts)) throw tooManyAttempts();
}

export async function recordLoginFailure(repo: LoginThrottleRepository, keys: string[], now: Date): Promise<void> {
  await repo.recordLoginFailures(keys, now);
  await repo.pruneLoginFailures(new Date(now.getTime() - LOGIN_WINDOW_MS));
}

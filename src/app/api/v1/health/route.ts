import { AppError, route } from "@/lib/api";
import { getPrisma } from "@/lib/prisma";

const HEALTH_TIMEOUT_MS = 3000;

function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const GET = route({ auth: false }, async () => {
  try {
    await withTimeout(getPrisma().$queryRaw`SELECT 1`, HEALTH_TIMEOUT_MS);
    return { status: "ok", database: "up" };
  } catch {
    throw new AppError(503, "SERVICE_UNAVAILABLE", "سامانه موقتا در دسترس نیست. کمی بعد دوباره تلاش کنید.");
  }
});

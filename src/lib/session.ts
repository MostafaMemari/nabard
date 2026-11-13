import { jwtVerify, SignJWT } from "jose";
import { AppError } from "./api/app-error";
import { getServerEnv } from "./env";

export const SESSION_COOKIE = "nabard_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_KEY_LABEL = "nabard.session.v1";

export type SessionRole = "ADMIN" | "COACH" | "SUPER_ADMIN";

export type CurrentUser = {
  id: string;
  role: SessionRole;
};

async function getSigningKey(): Promise<Uint8Array> {
  const { SESSION_SECRET, DATABASE_URL } = getServerEnv();
  const value = SESSION_SECRET ?? `${DATABASE_URL}\n${SESSION_KEY_LABEL}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

export async function createSessionToken(user: CurrentUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(await getSigningKey());
}

export async function verifySessionToken(token: string): Promise<CurrentUser | null> {
  try {
    const { payload } = await jwtVerify(token, await getSigningKey());
    const role = payload.role;
    if (typeof payload.sub !== "string" || (role !== "ADMIN" && role !== "COACH" && role !== "SUPER_ADMIN")) return null;
    return { id: payload.sub, role };
  } catch {
    return null;
  }
}

function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE && rest.length > 0) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireUser(request: Request, ...roles: SessionRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser(request);
  if (!user) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
  }
  return user;
}

function cookieAttributes(maxAge: number): string[] {
  const attributes = [`Path=/`, "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (process.env.NODE_ENV === "production") attributes.push("Secure");
  return attributes;
}

export function sessionCookie(token: string): string {
  return [`${SESSION_COOKIE}=${token}`, ...cookieAttributes(SESSION_MAX_AGE_SECONDS)].join("; ");
}

export function clearedSessionCookie(): string {
  return [`${SESSION_COOKIE}=`, ...cookieAttributes(0)].join("; ");
}

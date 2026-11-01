import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL = "postgresql://nabard:test@localhost:5432/test";
delete process.env.SESSION_SECRET;

const session = await import("./session");

const adminUser = { id: "user-1", role: "ADMIN" } as const;
const coachUser = { id: "user-2", role: "COACH" } as const;

function requestWithCookie(cookie?: string): Request {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new Request("http://localhost/api/v1/auth/me", { headers });
}

beforeEach(() => {
  delete process.env.SESSION_SECRET;
});

describe("getCurrentUser", () => {
  it("reads the user from a signed session cookie", async () => {
    const token = await session.createSessionToken(adminUser);
    const request = requestWithCookie(`${session.SESSION_COOKIE}=${token}`);

    await expect(session.getCurrentUser(request)).resolves.toEqual(adminUser);
  });

  it("returns null without a cookie", async () => {
    await expect(session.getCurrentUser(requestWithCookie())).resolves.toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await session.createSessionToken(adminUser);
    const request = requestWithCookie(`${session.SESSION_COOKIE}=${token}x`);

    await expect(session.getCurrentUser(request)).resolves.toBeNull();
  });

  it("returns null for an expired token", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const token = await session.createSessionToken(adminUser);
    vi.setSystemTime(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000));
    const request = requestWithCookie(`${session.SESSION_COOKIE}=${token}`);

    await expect(session.getCurrentUser(request)).resolves.toBeNull();
    vi.useRealTimers();
  });

  it("signs with SESSION_SECRET when it is set", async () => {
    const token = await session.createSessionToken(adminUser);
    await expect(session.verifySessionToken(token)).resolves.toEqual(adminUser);

    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret-0123456789";
    const fresh = await import("./session");

    const secretToken = await fresh.createSessionToken(adminUser);
    await expect(fresh.verifySessionToken(secretToken)).resolves.toEqual(adminUser);
    await expect(session.verifySessionToken(secretToken)).resolves.toBeNull();
    await expect(fresh.verifySessionToken(token)).resolves.toBeNull();
  });
});

describe("requireUser", () => {
  it("returns the user for any authenticated request", async () => {
    const token = await session.createSessionToken(coachUser);
    const request = requestWithCookie(`${session.SESSION_COOKIE}=${token}`);

    await expect(session.requireUser(request)).resolves.toEqual(coachUser);
  });

  it("returns the user when the role matches", async () => {
    const token = await session.createSessionToken(adminUser);
    const request = requestWithCookie(`${session.SESSION_COOKIE}=${token}`);

    await expect(session.requireUser(request, "ADMIN")).resolves.toEqual(adminUser);
  });

  it("throws 403 when the role does not match", async () => {
    const token = await session.createSessionToken(coachUser);
    const request = requestWithCookie(`${session.SESSION_COOKIE}=${token}`);

    await expect(session.requireUser(request, "ADMIN")).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("throws 401 without a session", async () => {
    await expect(session.requireUser(requestWithCookie(), "ADMIN")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });
});

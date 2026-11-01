import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import {
  assertCanLogin,
  isLockedOut,
  LOGIN_MAX_ATTEMPTS,
  type LoginThrottleRepository,
  loginThrottleKeys,
  mobileThrottleKey,
  recordLoginFailure,
} from "./throttle";

const now = new Date("2026-11-02T10:00:00.000Z");
const keys = loginThrottleKeys("09121110000", "ip:abc");

function repoWith(counts: Record<string, number>) {
  return {
    countLoginFailuresBy: vi.fn().mockResolvedValue(counts),
    recordLoginFailures: vi.fn().mockResolvedValue(undefined),
    clearLoginFailures: vi.fn().mockResolvedValue(undefined),
    pruneLoginFailures: vi.fn().mockResolvedValue(undefined),
  } satisfies LoginThrottleRepository;
}

describe("isLockedOut", () => {
  it("locks when any key reaches the attempt limit", () => {
    expect(isLockedOut({ "mobile:09121110000": LOGIN_MAX_ATTEMPTS, "ip:abc": 0 })).toBe(true);
    expect(isLockedOut({ "mobile:09121110000": 0, "ip:abc": LOGIN_MAX_ATTEMPTS })).toBe(true);
  });

  it("allows below the limit", () => {
    expect(isLockedOut({ "mobile:09121110000": LOGIN_MAX_ATTEMPTS - 1, "ip:abc": 2 })).toBe(false);
    expect(isLockedOut({})).toBe(false);
  });
});

describe("assertCanLogin", () => {
  it("passes when the count is below the limit", async () => {
    const repo = repoWith({ "mobile:09121110000": 2 });
    await expect(assertCanLogin(repo, keys, now)).resolves.toBeUndefined();
    expect(repo.countLoginFailuresBy).toHaveBeenCalledWith(keys, new Date(now.getTime() - 15 * 60 * 1000));
  });

  it("throws 429 with a Persian message at the limit", async () => {
    const failure = await assertCanLogin(repoWith({ "mobile:09121110000": 5, "ip:abc": 1 }), keys, now).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 429, code: "TOO_MANY_ATTEMPTS" });
    expect((failure as AppError).message).toContain("ورود موقتا مسدود شده است");
  });
});

describe("recordLoginFailure", () => {
  it("records one failure per key and prunes the window", async () => {
    const repo = repoWith({});
    await recordLoginFailure(repo, keys, now);

    expect(repo.recordLoginFailures).toHaveBeenCalledWith(keys, now);
    expect(repo.pruneLoginFailures).toHaveBeenCalledWith(new Date(now.getTime() - 15 * 60 * 1000));
  });
});

describe("loginThrottleKeys", () => {
  it("scopes failures by mobile and by ip", () => {
    expect(loginThrottleKeys("09121110000", "ip:abc")).toEqual(["mobile:09121110000", "ip:abc"]);
    expect(mobileThrottleKey("09120000000")).toBe("mobile:09120000000");
  });
});

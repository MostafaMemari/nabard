import { hashSync } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { UserRecord } from "./repository";
import { login } from "./service";

const password = "Secret!1234";

const activeAdmin: UserRecord = {
  id: "user-1",
  mobile: "09121110000",
  passwordHash: hashSync(password, 10),
  fullName: "مدیر سامانه",
  role: "ADMIN",
  province: "TEHRAN",
  isActive: true,
};

const inactiveAdmin: UserRecord = { ...activeAdmin, isActive: false };

function repoWith(user: UserRecord | null) {
  return { findUserByMobile: vi.fn().mockResolvedValue(user), findUserById: vi.fn().mockResolvedValue(user) };
}

describe("login", () => {
  it("returns the auth user for valid credentials", async () => {
    const result = await login(repoWith(activeAdmin), { mobile: "09121110000", password });

    expect(result).toEqual({ id: "user-1", role: "ADMIN", fullName: "مدیر سامانه", province: "TEHRAN" });
  });

  it("rejects a wrong password with 401", async () => {
    const failure = await login(repoWith(activeAdmin), { mobile: "09121110000", password: "WrongPass123" }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
  });

  it("returns the same error for an unknown mobile", async () => {
    const wrongPassword = await login(repoWith(activeAdmin), { mobile: "09121110000", password: "WrongPass123" }).catch(
      (error: unknown) => error,
    );
    const unknownMobile = await login(repoWith(null), { mobile: "09120000000", password }).catch((error: unknown) => error);

    expect(unknownMobile).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    expect((unknownMobile as AppError).message).toBe((wrongPassword as AppError).message);
  });

  it("rejects an inactive user with 403 even with valid credentials", async () => {
    const failure = await login(repoWith(inactiveAdmin), { mobile: "09121110000", password }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "USER_INACTIVE" });
  });
});

import { compareSync, hashSync } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { UserRecord } from "./repository";
import { changePassword, getProfile, login } from "./service";

const password = "Secret!1234";

const activeAdmin: UserRecord = {
  id: "user-1",
  mobile: "09121110000",
  passwordHash: hashSync(password, 10),
  fullName: "مدیر سامانه",
  role: "ADMIN",
  gender: null,
  province: "TEHRAN",
  isActive: true,
  countyId: null,
  countyName: null,
  photoFileId: null,
};

const inactiveAdmin: UserRecord = { ...activeAdmin, isActive: false };

function repoWith(user: UserRecord | null) {
  return {
    findUserByMobile: vi.fn().mockResolvedValue(user),
    findUserById: vi.fn().mockResolvedValue(user),
    updatePassword: vi.fn().mockResolvedValue(undefined),
  };
}

function throttleWith(counts: Record<string, number>) {
  return {
    repo: {
      countLoginFailuresBy: vi.fn().mockResolvedValue(counts),
      recordLoginFailures: vi.fn().mockResolvedValue(undefined),
      clearLoginFailures: vi.fn().mockResolvedValue(undefined),
      pruneLoginFailures: vi.fn().mockResolvedValue(undefined),
    },
    keys: ["mobile:09121110000", "ip:abc"],
  };
}

describe("login", () => {
  it("returns the auth user for valid credentials", async () => {
    const result = await login(repoWith(activeAdmin), { mobile: "09121110000", password });

    expect(result).toEqual({
      id: "user-1",
      role: "ADMIN",
      fullName: "مدیر سامانه",
      gender: null,
      province: "TEHRAN",
      countyId: null,
      countyName: null,
      hasPhoto: false,
    });
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

  it("blocks the login with 429 when the throttle reports a lockout", async () => {
    const throttle = throttleWith({ "mobile:09121110000": 5 });
    const failure = await login(repoWith(activeAdmin), { mobile: "09121110000", password }, throttle).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 429, code: "TOO_MANY_ATTEMPTS" });
    expect((failure as AppError).message).toContain("ورود موقتا مسدود شده است");
    expect(throttle.repo.recordLoginFailures).not.toHaveBeenCalled();
  });

  it("records a failure on wrong password and clears failures on success", async () => {
    const failing = throttleWith({});
    await login(repoWith(activeAdmin), { mobile: "09121110000", password: "WrongPass123" }, failing).catch(() => undefined);
    expect(failing.repo.recordLoginFailures).toHaveBeenCalledWith(failing.keys, expect.any(Date));

    const succeeding = throttleWith({});
    await login(repoWith(activeAdmin), { mobile: "09121110000", password }, succeeding);
    expect(succeeding.repo.recordLoginFailures).not.toHaveBeenCalled();
    expect(succeeding.repo.clearLoginFailures).toHaveBeenCalledWith(succeeding.keys);
  });
});

describe("changePassword", () => {
  it("updates the password when the current one matches", async () => {
    const repo = repoWith(activeAdmin);
    await changePassword(repo, { id: "user-1", role: "ADMIN" }, { currentPassword: password, newPassword: "NewPass1234" });

    expect(repo.updatePassword).toHaveBeenCalledWith("user-1", expect.any(String));
    const newHash = repo.updatePassword.mock.calls[0][1] as string;
    expect(compareSync("NewPass1234", newHash)).toBe(true);
  });

  it("rejects a wrong current password with 400 and keeps the old hash", async () => {
    const repo = repoWith(activeAdmin);
    const failure = await changePassword(
      repo,
      { id: "user-1", role: "ADMIN" },
      {
        currentPassword: "WrongPass123",
        newPassword: "NewPass1234",
      },
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 400, code: "INVALID_PASSWORD" });
    expect(failure).toMatchObject({ message: "رمز عبور فعلی اشتباه است." });
    expect(repo.updatePassword).not.toHaveBeenCalled();
  });

  it("rejects with 401 when the user no longer exists", async () => {
    const repo = repoWith(null);
    const failure = await changePassword(
      repo,
      { id: "gone", role: "COACH" },
      {
        currentPassword: password,
        newPassword: "NewPass1234",
      },
    ).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });
});

describe("getProfile with a nullable province", () => {
  const superAdminRecord: UserRecord = {
    id: "super-1",
    mobile: "09120000000",
    passwordHash: hashSync(password, 10),
    fullName: "مدیر کل",
    role: "SUPER_ADMIN",
    gender: null,
    province: null,
    isActive: true,
    countyId: null,
    countyName: null,
    photoFileId: null,
  };

  it("returns a super admin with a null province and county", async () => {
    const result = await getProfile(repoWith(superAdminRecord), { id: "super-1", role: "SUPER_ADMIN" });

    expect(result).toEqual({
      id: "super-1",
      role: "SUPER_ADMIN",
      fullName: "مدیر کل",
      gender: null,
      province: null,
      countyId: null,
      countyName: null,
      hasPhoto: false,
    });
  });

  it("keeps the province of admins and coaches", async () => {
    const result = await getProfile(repoWith(activeAdmin), { id: "user-1", role: "ADMIN" });

    expect(result.province).toBe("TEHRAN");
  });
});

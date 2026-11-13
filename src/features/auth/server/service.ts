import { compare, hash } from "bcryptjs";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type { AuthUser } from "../types";
import type { UserRecord } from "./repository";
import { assertCanLogin, type LoginThrottleRepository, recordLoginFailure } from "./throttle";

export type UserRepository = {
  findUserByMobile(mobile: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
};

export type LoginThrottle = { repo: LoginThrottleRepository; keys: string[] };

const DUMMY_HASH = "$2b$10$PNXdhH9FOvtoM3Ehi3KPoOFNJmVH1NLt70Bfc6gA5Xm8UmnQ1b6Ly";

function invalidCredentials(): AppError {
  return new AppError(401, "INVALID_CREDENTIALS", "شماره همراه یا رمز عبور اشتباه است");
}

function toAuthUser(user: UserRecord, photoUrl: string | null): AuthUser {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    gender: user.gender,
    province: user.province,
    countyId: user.countyId,
    countyName: user.countyName,
    hasPhoto: user.role === "COACH" && user.photoFileId !== null,
    photoUrl,
  };
}

// The coach photo lives in R2 and is displayed straight from its public
// endpoint: no signature and no backend hop. When the url cannot be resolved
// (local development without the public endpoint) it is null and the UI
// shows the fallback avatar.
async function coachPhotoUrl(storage: Storage, user: UserRecord): Promise<string | null> {
  if (user.role !== "COACH" || user.photoFileId === null) return null;

  const urls = await storage.getUrls([user.photoFileId]);
  return urls.get(user.photoFileId) ?? null;
}

export async function login(
  users: UserRepository,
  input: { mobile: string; password: string },
  throttle?: LoginThrottle,
  storage?: Storage,
): Promise<AuthUser> {
  const now = new Date();
  if (throttle) await assertCanLogin(throttle.repo, throttle.keys, now);

  const user = await users.findUserByMobile(input.mobile);
  if (!user) {
    await compare(input.password, DUMMY_HASH);
    if (throttle) await recordLoginFailure(throttle.repo, throttle.keys, now);
    throw invalidCredentials();
  }

  const passwordMatches = await compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    if (throttle) await recordLoginFailure(throttle.repo, throttle.keys, now);
    throw invalidCredentials();
  }

  if (!user.isActive) {
    throw new AppError(403, "USER_INACTIVE", "حساب کاربری شما غیرفعال است. با مدیر استان تماس بگیرید");
  }

  if (throttle) await throttle.repo.clearLoginFailures(throttle.keys);

  return toAuthUser(user, storage ? await coachPhotoUrl(storage, user) : null);
}

export async function getProfile(users: UserRepository, user: CurrentUser, storage: Storage): Promise<AuthUser> {
  const record = await users.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive) {
    throw new AppError(403, "USER_INACTIVE", "حساب کاربری شما غیرفعال است. با مدیر استان تماس بگیرید");
  }
  return toAuthUser(record, await coachPhotoUrl(storage, record));
}

export async function changePassword(
  users: UserRepository,
  user: CurrentUser,
  input: { currentPassword: string; newPassword: string },
): Promise<null> {
  const record = await users.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");

  const matches = await compare(input.currentPassword, record.passwordHash);
  if (!matches) throw new AppError(400, "INVALID_PASSWORD", "رمز عبور فعلی اشتباه است");

  await users.updatePassword(user.id, await hash(input.newPassword, 10));

  return null;
}

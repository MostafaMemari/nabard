import { compare } from "bcryptjs";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { AuthUser } from "../types";
import type { UserRecord } from "./repository";

export type UserRepository = {
  findUserByMobile(mobile: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
};

const DUMMY_HASH = "$2b$10$PNXdhH9FOvtoM3Ehi3KPoOFNJmVH1NLt70Bfc6gA5Xm8UmnQ1b6Ly";

function invalidCredentials(): AppError {
  return new AppError(401, "INVALID_CREDENTIALS", "شماره همراه یا رمز عبور اشتباه است.");
}

function toAuthUser(user: UserRecord): AuthUser {
  return { id: user.id, role: user.role, fullName: user.fullName, province: user.province };
}

export async function login(users: UserRepository, input: { mobile: string; password: string }): Promise<AuthUser> {
  const user = await users.findUserByMobile(input.mobile);
  if (!user) {
    await compare(input.password, DUMMY_HASH);
    throw invalidCredentials();
  }

  const passwordMatches = await compare(input.password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials();

  if (!user.isActive) {
    throw new AppError(403, "USER_INACTIVE", "حساب کاربری شما غیرفعال است. با مدیر استان تماس بگیرید.");
  }

  return toAuthUser(user);
}

export async function getProfile(users: UserRepository, user: CurrentUser): Promise<AuthUser> {
  const record = await users.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive) {
    throw new AppError(403, "USER_INACTIVE", "حساب کاربری شما غیرفعال است. با مدیر استان تماس بگیرید.");
  }
  return toAuthUser(record);
}

import { api } from "@/lib/http";
import type { ChangePasswordInput, LoginInput } from "./schemas";
import type { AuthUser } from "./types";

export function login(input: LoginInput): Promise<AuthUser> {
  return api<AuthUser>("/api/v1/auth/login", { method: "POST", body: input });
}

export function logout(): Promise<null> {
  return api<null>("/api/v1/auth/logout", { method: "POST" });
}

export function getMe(): Promise<AuthUser> {
  return api<AuthUser>("/api/v1/auth/me");
}

export function changePassword(input: ChangePasswordInput): Promise<null> {
  return api<null>("/api/v1/auth/password", { method: "POST", body: input });
}

import { mockDelay } from "@/lib/mock";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import { users } from "./mock/users";
import type { CoachInput, User } from "./types";

export type CoachListParams = ListQuery & {
  search?: string;
  status?: "active" | "inactive";
};

export async function listCoaches(params: CoachListParams = {}): Promise<ListResult<User>> {
  await mockDelay();
  const search = params.search?.trim() ?? "";
  const filtered = users.filter(
    (user) =>
      user.role === "COACH" &&
      (params.status === undefined || (params.status === "active" ? user.isActive : !user.isActive)) &&
      (search === "" || user.fullName.includes(search) || user.mobile.includes(search)),
  );

  return paginate(filtered, params);
}

export async function getCoach(id: string): Promise<User> {
  await mockDelay();
  const coach = users.find((user) => user.id === id && user.role === "COACH");

  if (!coach) {
    throw new Error("مربی یافت نشد.");
  }

  return coach;
}

export async function createCoach(input: CoachInput): Promise<User> {
  await mockDelay();

  if (users.some((user) => user.mobile === input.mobile)) {
    throw new Error("این شماره همراه قبلاً ثبت شده است.");
  }
  if (users.some((user) => user.nationalCode === input.nationalCode)) {
    throw new Error("این کد ملی قبلاً ثبت شده است.");
  }

  const now = new Date().toISOString();
  const coach: User = {
    id: `coach-${users.filter((user) => user.role === "COACH").length + 1}`,
    mobile: input.mobile,
    fullName: input.fullName,
    nationalCode: input.nationalCode,
    role: "COACH",
    province: "TEHRAN",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  users.push(coach);

  return coach;
}

export async function updateCoachStatus(id: string, isActive: boolean): Promise<User> {
  await mockDelay();
  const coach = users.find((user) => user.id === id && user.role === "COACH");

  if (!coach) {
    throw new Error("مربی یافت نشد.");
  }

  coach.isActive = isActive;
  coach.updatedAt = new Date().toISOString();

  return coach;
}

import { mockDelay } from "@/lib/mock";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import { users } from "./mock/users";
import type { User } from "./types";

export type CoachListParams = ListQuery & {
  search?: string;
  activeOnly?: boolean;
};

export async function listCoaches(params: CoachListParams = {}): Promise<ListResult<User>> {
  await mockDelay();
  const search = params.search?.trim() ?? "";
  const filtered = users.filter(
    (user) =>
      user.role === "COACH" &&
      (!params.activeOnly || user.isActive) &&
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

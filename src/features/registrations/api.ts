import { mockDelay } from "@/lib/mock";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import { registrations } from "./mock/registrations";
import type { Registration, RegistrationStatus } from "./types";

export type RegistrationListParams = ListQuery & {
  competitionId?: string;
  coachId?: string;
  paymentId?: string;
  status?: RegistrationStatus;
};

export async function listRegistrations(params: RegistrationListParams = {}): Promise<ListResult<Registration>> {
  await mockDelay();
  const filtered = registrations.filter(
    (registration) =>
      (params.competitionId === undefined || registration.competitionId === params.competitionId) &&
      (params.coachId === undefined || registration.coachId === params.coachId) &&
      (params.paymentId === undefined || registration.paymentId === params.paymentId) &&
      (params.status === undefined || registration.status === params.status),
  );

  return paginate(filtered, params);
}

export async function getRegistration(id: string): Promise<Registration> {
  await mockDelay();
  const registration = registrations.find((item) => item.id === id);

  if (!registration) {
    throw new Error("ثبت نام یافت نشد.");
  }

  return registration;
}

export async function updateRegistrationStatus(id: string, status: RegistrationStatus, note: string | null = null): Promise<Registration> {
  await mockDelay();
  const index = registrations.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("ثبت نام یافت نشد.");
  }

  registrations[index] = { ...registrations[index], status, note, updatedAt: new Date().toISOString() };

  return registrations[index];
}

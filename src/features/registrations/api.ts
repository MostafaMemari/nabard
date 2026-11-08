import type { Payment } from "@/features/payments";
import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { EventDay, EventDayRowPatch, Participant, Registration, RegistrationDetail, RegistrationStatus } from "./types";

export type RegistrationListParams = ListQuery & {
  competitionId?: string;
  coachId?: string;
  paymentId?: string;
  studentId?: string;
  status?: RegistrationStatus;
};

export type CreateRegistrationsInput = {
  competitionId: string;
  studentIds: string[];
  weights?: Record<string, number>;
  receipt: File;
};

export type CreateRegistrationsResult = {
  payment: Payment;
  registrations: Registration[];
};

export async function listRegistrations(params: RegistrationListParams = {}): Promise<ListResult<Registration>> {
  const query = new URLSearchParams();
  if (params.competitionId) query.set("competitionId", params.competitionId);
  if (params.coachId) query.set("coachId", params.coachId);
  if (params.paymentId) query.set("paymentId", params.paymentId);
  if (params.studentId) query.set("studentId", params.studentId);
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<Registration>>(`/api/v1/registrations${queryString === "" ? "" : `?${queryString}`}`);
}

export function getRegistrationDetail(id: string): Promise<RegistrationDetail> {
  return api<RegistrationDetail>(`/api/v1/registrations/${id}`);
}

export function createRegistrations(input: CreateRegistrationsInput): Promise<CreateRegistrationsResult> {
  const form = new FormData();
  for (const studentId of input.studentIds) {
    form.append("studentIds", studentId);
  }
  if (input.weights && Object.keys(input.weights).length > 0) {
    form.append("weights", JSON.stringify(input.weights));
  }
  form.append("receipt", input.receipt);

  return api<CreateRegistrationsResult>(`/api/v1/competitions/${input.competitionId}/registrations`, { method: "POST", body: form });
}

export function approveRegistration(id: string): Promise<Registration> {
  return api<Registration>(`/api/v1/registrations/${id}/approve`, { method: "POST" });
}

export function rejectRegistration(id: string, note: string): Promise<Registration> {
  return api<Registration>(`/api/v1/registrations/${id}/reject`, { method: "POST", body: { note } });
}

export function listParticipants(competitionId: string): Promise<Participant[]> {
  return api<Participant[]>(`/api/v1/competitions/${competitionId}/participants`);
}

export function getEventDay(competitionId: string): Promise<EventDay> {
  return api<EventDay>(`/api/v1/competitions/${competitionId}/event-day`);
}

export function weighInRegistration(id: string, weightKg: number): Promise<EventDayRowPatch> {
  return api<EventDayRowPatch>(`/api/v1/registrations/${id}/weigh-in`, { method: "POST", body: { weightKg } });
}

export function setRegistrationCheckIn(id: string, checkedIn: boolean): Promise<EventDayRowPatch> {
  return api<EventDayRowPatch>(`/api/v1/registrations/${id}/check-in`, { method: "POST", body: { checkedIn } });
}

import type { Gender } from "@/features/base-data";
import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type {
  RegistrationRequest,
  RegistrationRequestDetail,
  RegistrationStatus,
  Student,
  StudentDetail,
  StudentImportResult,
  StudentInput,
} from "./types";

export type StudentListParams = ListQuery & {
  coachId?: string;
  gender?: Gender;
  search?: string;
  beltId?: string;
};

export async function listStudents(params: StudentListParams = {}): Promise<ListResult<Student>> {
  const query = new URLSearchParams();
  if (params.coachId) query.set("coachId", params.coachId);
  if (params.gender) query.set("gender", params.gender);
  if (params.search) query.set("search", params.search);
  if (params.beltId) query.set("beltId", params.beltId);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<Student>>(`/api/v1/students${queryString === "" ? "" : `?${queryString}`}`);
}

export function getStudent(id: string): Promise<StudentDetail> {
  return api<StudentDetail>(`/api/v1/students/${id}`);
}

export function importStudents(file: File, coachId?: string): Promise<StudentImportResult> {
  const form = new FormData();
  form.append("file", file);
  const path = coachId === undefined ? "/api/v1/students/import" : `/api/v1/coaches/${coachId}/students/import`;
  return api<StudentImportResult>(path, { method: "POST", body: form });
}

export function deleteStudent(id: string): Promise<{ id: string }> {
  return api<{ id: string }>(`/api/v1/students/${id}`, { method: "DELETE" });
}

export type RegistrationRequestListParams = ListQuery & { status?: RegistrationStatus };

export async function listRegistrationRequests(params: RegistrationRequestListParams = {}): Promise<ListResult<RegistrationRequestDetail>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<RegistrationRequestDetail>>(`/api/v1/registration-requests${queryString === "" ? "" : `?${queryString}`}`);
}

export function getRegistrationRequest(id: string): Promise<RegistrationRequestDetail> {
  return api<RegistrationRequestDetail>(`/api/v1/registration-requests/${id}`);
}

export function createRegistrationRequest(input: StudentInput): Promise<RegistrationRequest> {
  return api<RegistrationRequest>("/api/v1/registration-requests", { method: "POST", body: input });
}

export function updateRegistrationRequest(id: string, input: StudentInput): Promise<RegistrationRequest> {
  return api<RegistrationRequest>(`/api/v1/registration-requests/${id}`, { method: "PATCH", body: input });
}

export function setRegistrationRequestPhoto(id: string, file: File): Promise<RegistrationRequest> {
  const form = new FormData();
  form.append("file", file);
  return api<RegistrationRequest>(`/api/v1/registration-requests/${id}/photo`, { method: "POST", body: form });
}

export function updateRegistrationRequestBelt(id: string, beltId: string): Promise<RegistrationRequest> {
  return api<RegistrationRequest>(`/api/v1/registration-requests/${id}/belt`, { method: "PATCH", body: { beltId } });
}

export function approveRegistrationRequest(id: string): Promise<RegistrationRequest> {
  return api<RegistrationRequest>(`/api/v1/registration-requests/${id}/approve`, { method: "POST" });
}

export function rejectRegistrationRequest(id: string, note: string): Promise<RegistrationRequest> {
  return api<RegistrationRequest>(`/api/v1/registration-requests/${id}/reject`, { method: "POST", body: { note } });
}

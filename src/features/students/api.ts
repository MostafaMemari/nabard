import type { Gender } from "@/features/base-data";
import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { PendingReviewStudent, Student, StudentDetail, StudentDocument, StudentDocumentType, StudentInput } from "./types";

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

export function createStudent(input: StudentInput): Promise<Student> {
  return api<Student>("/api/v1/students", { method: "POST", body: input });
}

export function updateStudent(id: string, input: Partial<StudentInput>): Promise<Student> {
  return api<Student>(`/api/v1/students/${id}`, { method: "PATCH", body: input });
}

export function deleteStudent(id: string): Promise<{ id: string }> {
  return api<{ id: string }>(`/api/v1/students/${id}`, { method: "DELETE" });
}

export async function uploadStudentDocument(studentId: string, type: StudentDocumentType, file: File): Promise<StudentDocument> {
  const form = new FormData();
  form.append("file", file);

  return api<StudentDocument>(`/api/v1/students/${studentId}/documents/${type}`, { method: "PUT", body: form });
}

export function deleteStudentDocument(studentId: string, type: StudentDocumentType): Promise<{ type: StudentDocumentType }> {
  return api<{ type: StudentDocumentType }>(`/api/v1/students/${studentId}/documents/${type}`, { method: "DELETE" });
}

export type PendingReviewParams = ListQuery & { status?: "PENDING" | "REJECTED" };

export async function listPendingReview(params: PendingReviewParams = {}): Promise<ListResult<PendingReviewStudent>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<PendingReviewStudent>>(`/api/v1/students/pending-review${queryString === "" ? "" : `?${queryString}`}`);
}

export function approveStudentProfile(id: string): Promise<Student> {
  return api<Student>(`/api/v1/students/${id}/approve`, { method: "POST" });
}

export function rejectStudentProfile(id: string, note: string): Promise<Student> {
  return api<Student>(`/api/v1/students/${id}/reject`, { method: "POST", body: { note } });
}

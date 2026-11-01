import type { Gender } from "@/features/base-data";
import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { Student, StudentInput } from "./types";

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

export function getStudent(id: string): Promise<Student> {
  return api<Student>(`/api/v1/students/${id}`);
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

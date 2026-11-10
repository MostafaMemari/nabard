import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { PhotoChangeListQuery } from "./schemas";
import type { CoachPhotoChangeRequest, PhotoChangeRequest, PhotoChangeStatus } from "./types";

export type PhotoChangeListParams = ListQuery & {
  status?: PhotoChangeStatus;
};

// Coach uploads the replacement photo with the request.
export function requestStudentPhotoChange(studentId: string, file: File): Promise<CoachPhotoChangeRequest> {
  const form = new FormData();
  form.append("file", file);

  return api<CoachPhotoChangeRequest>(`/api/v1/students/${studentId}/photo-change-requests`, { method: "POST", body: form });
}

export async function listPhotoChangeRequests(
  params: PhotoChangeListParams = {},
): Promise<ListResult<PhotoChangeRequest | CoachPhotoChangeRequest>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<PhotoChangeRequest | CoachPhotoChangeRequest>>(
    `/api/v1/students/photo-change-requests${queryString === "" ? "" : `?${queryString}`}`,
  );
}

// Pending (or decided) photo of the request, served by the authenticated
// backend; the admin previews and downloads it from here.
export function photoChangeFileUrl(id: string, download = false): string {
  return `/api/v1/students/photo-change-requests/${id}/file${download ? "?download=1" : ""}`;
}

export function approvePhotoChangeRequest(id: string): Promise<PhotoChangeRequest> {
  return api<PhotoChangeRequest>(`/api/v1/students/photo-change-requests/${id}/approve`, { method: "POST", body: {} });
}

export function rejectPhotoChangeRequest(id: string, note: string): Promise<PhotoChangeRequest> {
  return api<PhotoChangeRequest>(`/api/v1/students/photo-change-requests/${id}/reject`, { method: "POST", body: { note } });
}

export type { PhotoChangeListQuery };

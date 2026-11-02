export const auditActions = {
  adminCreated: "admin.created",
  adminActivated: "admin.activated",
  adminDeactivated: "admin.deactivated",
  adminPasswordReset: "admin.password_reset",
  countyCreated: "county.created",
  countyUpdated: "county.updated",
  countyDeleted: "county.deleted",
  countyDefaultsAdded: "county.defaults_added",
  ageCategoryDatesChanged: "age_category.dates_changed",
  transferRequested: "transfer.requested",
  transferApproved: "transfer.approved",
  transferRejected: "transfer.rejected",
  studentsReassigned: "students.reassigned",
} as const;

export const auditEntityTypes = {
  admin: "admin",
  county: "county",
  ageCategory: "age_category",
  transfer: "transfer",
  coach: "coach",
} as const;

export type AuditEntry = {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: unknown;
};

export type AuditRepository = {
  createAuditLog(entry: AuditEntry): Promise<void>;
};

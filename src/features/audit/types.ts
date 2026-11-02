export const auditActions = {
  adminCreated: "admin.created",
  adminActivated: "admin.activated",
  adminDeactivated: "admin.deactivated",
  adminPasswordReset: "admin.password_reset",
  countyCreated: "county.created",
  countyUpdated: "county.updated",
  countyDeleted: "county.deleted",
  countyDefaultsAdded: "county.defaults_added",
  beltCreated: "belt.created",
  beltUpdated: "belt.updated",
  beltArchived: "belt.archived",
  beltRestored: "belt.restored",
  beltDeleted: "belt.deleted",
  ageCategoryCreated: "age_category.created",
  ageCategoryUpdated: "age_category.updated",
  ageCategoryArchived: "age_category.archived",
  ageCategoryRestored: "age_category.restored",
  ageCategoryDeleted: "age_category.deleted",
  weightClassSetUpdated: "weight_class_set.updated",
  transferRequested: "transfer.requested",
  transferApproved: "transfer.approved",
  transferRejected: "transfer.rejected",
  studentsReassigned: "students.reassigned",
} as const;

export const auditEntityTypes = {
  admin: "admin",
  county: "county",
  belt: "belt",
  ageCategory: "age_category",
  weightClassSet: "weight_class_set",
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

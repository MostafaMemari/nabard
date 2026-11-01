import { getPrisma } from "@/lib/prisma";
import type { AuditEntry, AuditRepository } from "../types";

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  await getPrisma().auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      details: (entry.details ?? undefined) as never,
    },
    select: { id: true },
  });
}

export const auditRepository: AuditRepository = { createAuditLog };

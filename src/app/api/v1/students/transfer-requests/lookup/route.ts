import { transferLookupSchema } from "@/features/transfers/schemas";
import * as repository from "@/features/transfers/server/repository";
import { lookupTransferStudent } from "@/features/transfers/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["COACH"], body: transferLookupSchema }, async ({ user, body }) =>
  lookupTransferStudent(repository, user, body.nationalCode),
);

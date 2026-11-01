import * as repository from "@/features/base-data/server/repository";
import { getBaseData } from "@/features/base-data/server/service";
import { route } from "@/lib/api";

export const GET = route({}, async () => getBaseData(repository));

import type { BaseDataResult } from "./repository";
import * as repository from "./repository";

export type { BaseDataResult };

export async function getBaseData(repo: typeof repository = repository): Promise<BaseDataResult> {
  return repo.getBaseData();
}

import type { PrismaClient } from "../src/generated/client";
import { jalaliYear } from "../src/lib/format";
import { ageCategories, belts, weightClasses } from "./data/base-data";

export type BaseDataSeedClient = Pick<PrismaClient, "belt" | "ageCategory" | "weightClass">;

export type BaseDataSeedResult = { belts: number; ageCategories: number; weightClasses: number };

// Base data is inserted only when the table is empty, so re-running the seed
// never reverts edits made by the super admin.
export async function seedBaseData(client: BaseDataSeedClient): Promise<BaseDataSeedResult> {
  const [beltCount, categoryCount, weightClassCount] = await Promise.all([
    client.belt.count(),
    client.ageCategory.count(),
    client.weightClass.count(),
  ]);

  const result: BaseDataSeedResult = { belts: 0, ageCategories: 0, weightClasses: 0 };

  if (beltCount === 0) {
    await client.belt.createMany({ data: belts });
    result.belts = belts.length;
  }

  if (categoryCount === 0) {
    await client.ageCategory.createMany({
      data: ageCategories.map((category) => {
        const startDate = new Date(category.startDate);
        const endDate = new Date(category.endDate);

        return {
          id: category.id,
          code: category.code,
          label: category.label,
          startDate,
          endDate,
          birthYearStart: jalaliYear(startDate),
          birthYearEnd: jalaliYear(endDate),
        };
      }),
    });
    result.ageCategories = ageCategories.length;
  }

  if (weightClassCount === 0) {
    await client.weightClass.createMany({ data: weightClasses });
    result.weightClasses = weightClasses.length;
  }

  return result;
}

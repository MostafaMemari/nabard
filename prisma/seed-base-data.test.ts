import { beforeEach, describe, expect, it, vi } from "vitest";
import { jalaliYear } from "../src/lib/format";
import { ageCategories, belts, weightClasses } from "./data/base-data";
import { type BaseDataSeedClient, seedBaseData } from "./seed-base-data";

function clientWith(counts: { belt: number; ageCategory: number; weightClass: number }) {
  const calls = { belt: 0, ageCategory: 0, weightClass: 0 };
  const client = {
    belt: {
      count: vi.fn().mockResolvedValue(counts.belt),
      createMany: vi.fn().mockImplementation(async () => {
        calls.belt += 1;
        return {};
      }),
    },
    ageCategory: {
      count: vi.fn().mockResolvedValue(counts.ageCategory),
      createMany: vi.fn().mockImplementation(async () => {
        calls.ageCategory += 1;
        return {};
      }),
    },
    weightClass: {
      count: vi.fn().mockResolvedValue(counts.weightClass),
      createMany: vi.fn().mockImplementation(async () => {
        calls.weightClass += 1;
        return {};
      }),
    },
  };

  return { client: client as unknown as BaseDataSeedClient & Record<string, unknown>, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("seedBaseData", () => {
  it("inserts everything when the tables are empty", async () => {
    const { client, calls } = clientWith({ belt: 0, ageCategory: 0, weightClass: 0 });
    const result = await seedBaseData(client);

    expect(calls).toEqual({ belt: 1, ageCategory: 1, weightClass: 1 });
    expect(result).toEqual({ belts: belts.length, ageCategories: ageCategories.length, weightClasses: weightClasses.length });
  });

  it("inserts nothing when the tables already have rows, so edits are never reverted", async () => {
    const { client, calls } = clientWith({ belt: 19, ageCategory: 7, weightClass: 100 });
    const result = await seedBaseData(client);

    expect(calls).toEqual({ belt: 0, ageCategory: 0, weightClass: 0 });
    expect(result).toEqual({ belts: 0, ageCategories: 0, weightClasses: 0 });
    expect(client.belt.createMany).not.toHaveBeenCalled();
  });

  it("fills only the empty tables", async () => {
    const { client, calls } = clientWith({ belt: 5, ageCategory: 0, weightClass: 12 });
    await seedBaseData(client);

    expect(calls).toEqual({ belt: 0, ageCategory: 1, weightClass: 0 });
  });

  it("seeds the age categories with Jalali birth years derived from the dates", async () => {
    const { client } = clientWith({ belt: 0, ageCategory: 0, weightClass: 0 });
    await seedBaseData(client);

    const senior = ageCategories.find((category) => category.code === "senior");
    expect(senior).toBeDefined();

    const createMany = vi.mocked(client.ageCategory.createMany);
    const firstCall = createMany.mock.calls[0]?.[0] as { data: Array<{ code: string; birthYearStart: number }> } | undefined;
    expect(firstCall).toBeDefined();

    const seniorRow = firstCall?.data.find((row) => row.code === "senior");
    expect(seniorRow).toBeDefined();
    if (senior !== undefined && seniorRow !== undefined) {
      expect(seniorRow.birthYearStart).toBe(jalaliYear(new Date(senior.startDate)));
    }
  });
});

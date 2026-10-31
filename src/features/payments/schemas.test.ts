import { describe, expect, it } from "vitest";
import { rejectPaymentSchema } from "./schemas";

describe("rejectPaymentSchema", () => {
  it("accepts a meaningful note", () => {
    const result = rejectPaymentSchema.safeParse({ note: "  مبلغ واریزی با تعداد هنرجویان مطابقت ندارد.  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBe("مبلغ واریزی با تعداد هنرجویان مطابقت ندارد.");
    }
  });

  it("rejects an empty or too short note", () => {
    expect(rejectPaymentSchema.safeParse({ note: "" }).success).toBe(false);
    expect(rejectPaymentSchema.safeParse({ note: "  " }).success).toBe(false);
    expect(rejectPaymentSchema.safeParse({ note: "رد" }).success).toBe(false);
  });

  it("rejects a note longer than 500 characters", () => {
    expect(rejectPaymentSchema.safeParse({ note: "x".repeat(501) }).success).toBe(false);
  });
});

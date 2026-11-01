import { describe, expect, it } from "vitest";
import { competitions } from "./competitions/mock/competitions";
import { payments } from "./payments/mock/payments";
import { registrations } from "./registrations/mock/registrations";

describe("mock data", () => {
  it("has the required volume", () => {
    expect(competitions).toHaveLength(6);
    expect(payments).toHaveLength(12);
    expect(registrations).toHaveLength(31);
  });

  it("covers every status", () => {
    expect(new Set(competitions.map((item) => item.status))).toEqual(new Set(["DRAFT", "PUBLISHED", "CANCELED"]));
    expect(new Set(payments.map((item) => item.status))).toEqual(new Set(["PENDING", "CONFIRMED", "REJECTED"]));
    expect(new Set(registrations.map((item) => item.status))).toEqual(new Set(["PENDING", "APPROVED", "REJECTED"]));
  });

  it("keeps references intact", () => {
    const competitionIds = new Set(competitions.map((competition) => competition.id));
    const paymentIds = new Set(payments.map((payment) => payment.id));

    expect(payments.every((payment) => competitionIds.has(payment.competitionId))).toBe(true);
    expect(
      registrations.every(
        (registration) =>
          competitionIds.has(registration.competitionId) && (registration.paymentId === null || paymentIds.has(registration.paymentId)),
      ),
    ).toBe(true);
    expect(new Set(registrations.map((item) => `${item.competitionId}-${item.studentId}`)).size).toBe(registrations.length);
  });
});

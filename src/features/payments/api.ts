import { mockDelay } from "@/lib/mock";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import { payments } from "./mock/payments";
import type { Payment, PaymentStatus } from "./types";

export type PaymentListParams = ListQuery & {
  status?: PaymentStatus;
  coachId?: string;
  competitionId?: string;
};

export async function listPayments(params: PaymentListParams = {}): Promise<ListResult<Payment>> {
  await mockDelay();
  const filtered = payments.filter(
    (payment) =>
      (params.status === undefined || payment.status === params.status) &&
      (params.coachId === undefined || payment.coachId === params.coachId) &&
      (params.competitionId === undefined || payment.competitionId === params.competitionId),
  );

  return paginate(filtered, params);
}

export async function getPayment(id: string): Promise<Payment> {
  await mockDelay();
  const payment = payments.find((item) => item.id === id);

  if (!payment) {
    throw new Error("پرداخت یافت نشد.");
  }

  return payment;
}

export async function updatePaymentStatus(id: string, status: PaymentStatus, note: string | null = null): Promise<Payment> {
  await mockDelay();
  const index = payments.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("پرداخت یافت نشد.");
  }

  payments[index] = { ...payments[index], status, note, updatedAt: new Date().toISOString() };

  return payments[index];
}

export async function confirmPayment(id: string): Promise<Payment> {
  return updatePaymentStatus(id, "CONFIRMED");
}

export async function rejectPayment(id: string, note: string): Promise<Payment> {
  return updatePaymentStatus(id, "REJECTED", note);
}

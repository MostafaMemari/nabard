import type { Registration } from "@/features/registrations";

export type PaymentStudentActions = {
  canApprove: boolean;
  busyId: string | null;
  onApprove: (registration: Registration) => Promise<void>;
  onRejectOpen: (registration: Registration) => void;
};

"use client";

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Registration } from "@/features/registrations";
import type { PaymentStudentActions } from "./payment-student-actions";
import { PaymentStudentRow } from "./payment-student-row";

export function PaymentStudentsTable({ registrations, actions }: { registrations: Registration[]; actions: PaymentStudentActions }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>هنرجو</TableHead>
          <TableHead>کمربند</TableHead>
          <TableHead>وزن</TableHead>
          <TableHead>وضعیت</TableHead>
          <TableHead className="text-end">عملیات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((registration) => (
          <PaymentStudentRow key={registration.id} registration={registration} actions={actions} />
        ))}
      </TableBody>
    </Table>
  );
}

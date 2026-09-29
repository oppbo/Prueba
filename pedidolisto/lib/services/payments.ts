import type { DemoData, ID, Payment, PaymentMethod } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { round2 } from "@/lib/utils";
import { newId } from "./ids";
import { ServiceError } from "./orders";

export interface RegisterPaymentInput {
  customerId: ID;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
  salespersonId?: ID;
}

export function registerPayment(data: DemoData, input: RegisterPaymentInput): { data: DemoData; payment: Payment } {
  const customer = data.customers.find((c) => c.id === input.customerId);
  if (!customer) throw new ServiceError("Selecciona un cliente válido.");
  if (!(input.amount > 0)) throw new ServiceError("El monto debe ser mayor a cero.");
  const payment: Payment = {
    id: newId("pg"),
    customerId: customer.id,
    amount: round2(input.amount),
    method: input.method,
    date: input.date,
    notes: input.notes?.trim() || undefined,
    salespersonId: input.salespersonId ?? customer.salespersonId,
  };
  return {
    payment,
    data: {
      ...data,
      payments: [...data.payments, payment].sort((a, b) => a.date.localeCompare(b.date)),
      notifications: [
        {
          id: newId("n"),
          kind: "payment" as const,
          title: `Pago registrado de ${formatMoney(payment.amount)}`,
          description: `Cliente: ${customer.businessName}`,
          href: `/clientes/${customer.id}`,
          date: new Date().toISOString(),
          read: false,
        },
        ...data.notifications,
      ].slice(0, 40),
    },
  };
}

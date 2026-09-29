import type { Customer, DemoData, ID } from "@/lib/types";
import { newId } from "./ids";
import { ServiceError } from "./orders";

export type CustomerInput = Pick<
  Customer,
  "businessName" | "ownerName" | "phone" | "zone" | "address" | "customerType" | "priceList" | "creditLimit" | "salespersonId" | "notes"
>;

function validate(input: CustomerInput) {
  if (input.businessName.trim().length < 3) throw new ServiceError("Ingresa el nombre comercial.");
  if (input.ownerName.trim().length < 3) throw new ServiceError("Ingresa el nombre del propietario.");
  if (!/^[67]\d{7}$/.test(input.phone.replace(/\D/g, ""))) throw new ServiceError("El celular debe tener 8 dígitos y empezar con 6 o 7.");
  if (input.creditLimit < 0) throw new ServiceError("El límite de crédito no puede ser negativo.");
}

export function createCustomer(data: DemoData, input: CustomerInput): { data: DemoData; customer: Customer } {
  validate(input);
  const customer: Customer = {
    ...input,
    businessName: input.businessName.trim(),
    ownerName: input.ownerName.trim(),
    phone: input.phone.replace(/\D/g, ""),
    creditDays: 15,
    status: "active",
    createdAt: new Date().toISOString(),
    id: newId("c"),
  };
  return { customer, data: { ...data, customers: [customer, ...data.customers] } };
}

export function updateCustomer(data: DemoData, id: ID, input: CustomerInput): DemoData {
  validate(input);
  return {
    ...data,
    customers: data.customers.map((c) =>
      c.id === id ? { ...c, ...input, businessName: input.businessName.trim(), ownerName: input.ownerName.trim(), phone: input.phone.replace(/\D/g, "") } : c,
    ),
  };
}

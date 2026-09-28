/** Minimal invoice shape needed by the collection dialogs. */
export type CollectibleInvoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  outstanding_amount: number;
  due_date: string;
};

export function toCollectible(row: {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  outstanding_amount: number;
  due_date: string;
}): CollectibleInvoice {
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    outstanding_amount: Number(row.outstanding_amount),
    due_date: row.due_date,
  };
}

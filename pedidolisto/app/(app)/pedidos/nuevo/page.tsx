"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSnapshot, CustomerStep } from "@/components/order-form/customer-step";
import { ProductsStep } from "@/components/order-form/products-step";
import { PaymentStep } from "@/components/order-form/payment-step";
import { OrderSummary } from "@/components/order-form/order-summary";
import { useOrderLines } from "@/components/order-form/use-order-lines";
import { formatMoney } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useCurrentUser, useData } from "@/lib/store/hooks";
import type { ID, OrderChannel, PaymentType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;
const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Cliente" },
  { id: 2, label: "Productos" },
  { id: 3, label: "Pago" },
];

export default function NewOrderPage() {
  const data = useData();
  const user = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();
  const createOrder = useDemoStore((s) => s.createOrder);
  const takeDraft = useDemoStore((s) => s.draft);
  const setDraft = useDemoStore((s) => s.setDraft);

  const [initial] = useState(() => {
    const preset = params.get("cliente") ?? "";
    const draft = takeDraft;
    return {
      customerId: draft?.customerId ?? (data.customers.some((c) => c.id === preset) ? preset : ""),
      quantities: Object.fromEntries((draft?.items ?? []).map((i) => [i.productId, i.quantity])) as Record<ID, number>,
      paymentType: draft?.paymentType ?? ("cash" as PaymentType),
      channel: draft?.channel ?? ((user.role === "seller" ? "seller" : "phone") as OrderChannel),
      notes: draft?.notes ?? "",
      fromDraft: !!draft,
    };
  });

  const [step, setStep] = useState<Step>(initial.customerId ? 2 : 1);
  const [customerId, setCustomerId] = useState<ID | "">(initial.customerId);
  const [quantities, setQuantities] = useState<Record<ID, number>>(initial.quantities);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentType, setPaymentType] = useState<PaymentType>(initial.paymentType);
  const [channel, setChannel] = useState<OrderChannel>(initial.channel);
  const [notes, setNotes] = useState(initial.notes);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial.fromDraft) {
      setDraft(null);
      toast.info("Pedido cargado desde el asistente", { description: "Revisa cantidades y confirma." });
    }
  }, [initial.fromDraft, setDraft]);

  const customer = data.customers.find((c) => c.id === customerId);
  const { lines, units, subtotal, discount, total } = useOrderLines(customer, quantities, discountPercent);

  const lastOrder = useMemo(
    () =>
      customerId
        ? data.orders.filter((o) => o.customerId === customerId && o.status !== "cancelled").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        : undefined,
    [data.orders, customerId],
  );

  const selectCustomer = (id: ID | "") => {
    setCustomerId(id);
    const c = data.customers.find((x) => x.id === id);
    if (c && c.creditLimit <= 0) setPaymentType("cash");
    if (id && step === 1 && typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      // On phones, jump straight to products after choosing the customer.
      setTimeout(() => setStep(2), 150);
    }
  };

  const setQuantity = (productId: ID, quantity: number) => setQuantities((q) => ({ ...q, [productId]: quantity }));

  const repeatLast = () => {
    if (!lastOrder) return;
    setQuantities(Object.fromEntries(lastOrder.items.map((i) => [i.productId, i.quantity])));
    toast.success(`Se cargaron ${lastOrder.items.length} productos del pedido ${lastOrder.number}`);
  };

  const canGoTo = (target: Step) => target === 1 || (target === 2 && !!customer) || (target === 3 && !!customer && lines.length > 0);

  const next = () => {
    if (step === 1 && customer) setStep(2);
    else if (step === 2) {
      if (!lines.length) {
        toast.error("Agrega al menos un producto al pedido.");
        return;
      }
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirm = () => {
    if (!customer || !lines.length) return;
    setSubmitting(true);
    try {
      const order = createOrder({
        customerId: customer.id,
        salespersonId: user.salespersonId,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        discountPercent,
        paymentType,
        channel,
        notes,
      });
      toast.success(`Pedido #${order.number} creado correctamente`, { description: `${customer.businessName} · ${formatMoney(order.total)}` });
      router.push(`/pedidos/${order.id}`);
    } catch (err) {
      setSubmitting(false);
      toast.error(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    }
  };

  const primaryAction =
    step === 3 ? (
      <Button size="xl" className="w-full" onClick={confirm} loading={submitting} disabled={!customer || !lines.length}>
        <Check /> Confirmar pedido
      </Button>
    ) : (
      <Button size="xl" className="w-full" onClick={next} disabled={step === 1 ? !customer : !lines.length}>
        Continuar <ChevronRight />
      </Button>
    );

  return (
    <div className="mx-auto max-w-6xl pb-24 lg:pb-0">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/pedidos" aria-label="Volver a pedidos">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Nuevo pedido</h1>
        </div>
      </div>

      <ol className="mb-5 grid grid-cols-3 gap-2" aria-label="Pasos">
        {STEPS.map((s) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!canGoTo(s.id)}
                onClick={() => setStep(s.id)}
                className="group w-full text-left disabled:cursor-not-allowed"
                aria-current={active ? "step" : undefined}
              >
                <span className={cn("block h-1 rounded-full transition-colors", done || active ? "bg-primary" : "bg-border")} />
                <span className={cn("mt-2 flex items-center gap-1.5 text-xs font-medium sm:text-sm", active ? "text-foreground" : "text-muted-foreground")}>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full text-[11px] tabular",
                      done ? "bg-primary text-white" : active ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3" /> : s.id}
                  </span>
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">
          {step === 1 && <CustomerStep customerId={customerId} onSelect={selectCustomer} onContinue={next} />}
          {step === 2 && customer && (
            <>
              <CustomerMini name={customer.businessName} onChange={() => setStep(1)} />
              <ProductsStep customer={customer} quantities={quantities} onQuantity={setQuantity} onRepeatLast={repeatLast} canRepeat={!!lastOrder} />
            </>
          )}
          {step === 3 && customer && (
            <>
              <CustomerSnapshot customer={customer} />
              <Card className="lg:hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Resumen del pedido</CardTitle>
                  <button type="button" className="text-[13px] font-medium text-primary" onClick={() => setStep(2)}>
                    Editar
                  </button>
                </CardHeader>
                <CardContent>
                  <OrderSummary lines={lines} subtotal={subtotal} discount={discount} total={total} discountPercent={discountPercent} onDiscount={setDiscountPercent} />
                </CardContent>
              </Card>
              <h2 className="pt-2 text-base font-semibold">Condición de pago</h2>
              <PaymentStep
                customer={customer}
                total={total}
                paymentType={paymentType}
                onPaymentType={setPaymentType}
                channel={channel}
                onChannel={setChannel}
                notes={notes}
                onNotes={setNotes}
              />
              <div className="hidden lg:block">{primaryAction}</div>
            </>
          )}
        </div>

        {/* Desktop cart */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-muted-foreground" /> Pedido
              </CardTitle>
              <span className="text-xs text-muted-foreground tabular">
                {lines.length} productos · {units} u.
              </span>
            </CardHeader>
            <CardContent>
              <OrderSummary
                lines={lines}
                subtotal={subtotal}
                discount={discount}
                total={total}
                discountPercent={discountPercent}
                onDiscount={setDiscountPercent}
                onRemove={(id) => setQuantity(id, 0)}
              />
              {step !== 3 && <div className="mt-4">{primaryAction}</div>}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {step > 1 && (
            <div className="min-w-0 shrink-0">
              <p className="text-xs text-muted-foreground tabular">
                {lines.length} prod. · {units} u.
              </p>
              <p className="text-lg leading-tight font-semibold tabular">{formatMoney(total)}</p>
            </div>
          )}
          <div className="flex-1">{primaryAction}</div>
        </div>
      </div>
    </div>
  );
}

function CustomerMini({ name, onChange }: { name: string; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
      <span className="truncate">
        Cliente: <span className="font-medium">{name}</span>
      </span>
      <button type="button" onClick={onChange} className="shrink-0 font-medium text-primary">
        Cambiar
      </button>
    </div>
  );
}

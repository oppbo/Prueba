"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { ChatPanel, type ChatMessage } from "@/components/assistant/chat-panel";
import { ConfirmedState, DetectedOrder, IdleState, ProcessingState, type Phase } from "@/components/assistant/result-panel";
import { useOrderLines } from "@/components/order-form/use-order-lines";
import { parseOrderMessage, type ParsedOrder } from "@/lib/assistant/parser";
import { SAMPLE_MESSAGES } from "@/lib/assistant/samples";
import { formatMoney } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useAccounts, useCurrentUser, useData } from "@/lib/store/hooks";
import type { ID, Order, PaymentType } from "@/lib/types";
import { firstName } from "@/lib/utils";

const CUSTOM = "custom";

export default function AssistantPage() {
  const data = useData();
  const accounts = useAccounts();
  const user = useCurrentUser();
  const router = useRouter();
  const createOrder = useDemoStore((s) => s.createOrder);
  const setDraft = useDemoStore((s) => s.setDraft);

  const [sampleId, setSampleId] = useState(SAMPLE_MESSAGES[0].id);
  const [customText, setCustomText] = useState("");
  const [customCustomer, setCustomCustomer] = useState<ID>("c001");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<ParsedOrder | null>(null);
  const [quantities, setQuantities] = useState<Record<ID, number>>({});
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [created, setCreated] = useState<Order | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [receivedAt] = useState(() => new Date());

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const sample = SAMPLE_MESSAGES.find((m) => m.id === sampleId);
  const isCustom = sampleId === CUSTOM;
  const text = isCustom ? customText : sample?.text ?? "";
  const customerId = isCustom ? customCustomer : sample?.customerId ?? "c001";
  const customer = data.customers.find((c) => c.id === customerId)!;
  const account = accounts.get(customerId)!;
  const { lines, subtotal, total } = useOrderLines(customer, quantities, 0);

  const previousOrder = useMemo(
    () => data.orders.filter((o) => o.customerId === customerId && o.status !== "cancelled").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    [data.orders, customerId],
  );

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setPhase("idle");
    setParsed(null);
    setQuantities({});
    setCreated(null);
    setStep(0);
  };

  const selectSample = (id: string) => {
    setSampleId(id);
    reset();
  };

  const interpret = () => {
    if (!text.trim()) {
      toast.error("Escribe o pega un mensaje para interpretar.");
      return;
    }
    reset();
    setPhase("processing");
    const result = parseOrderMessage(text, previousOrder);
    timers.current = [
      setTimeout(() => setStep(1), 260),
      setTimeout(() => setStep(2), 540),
      setTimeout(() => {
        setParsed(result);
        setQuantities(Object.fromEntries(result.lines.map((l) => [l.productId, l.quantity])));
        setPaymentType(result.paymentType ?? "cash");
        if (customer.creditLimit <= 0) setPaymentType("cash");
        setPhase("done");
        if (!result.lines.length) toast.warning("No encontramos productos en el mensaje. Prueba con otro texto.");
      }, 820),
    ];
  };

  const setQuantity = (productId: ID, quantity: number) =>
    setQuantities((q) => {
      const next = { ...q };
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });

  const confirm = () => {
    try {
      const order = createOrder({
        customerId,
        salespersonId: user.salespersonId,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        discountPercent: 0,
        paymentType,
        channel: "whatsapp",
        notes: parsed?.delivery === "today" ? "Entrega hoy" : undefined,
      });
      setCreated(order);
      setPhase("confirmed");
      toast.success(`Pedido #${order.number} creado correctamente`, { description: `${customer.businessName} · ${formatMoney(order.total)}` });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    }
  };

  const edit = () => {
    setDraft({
      customerId,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      paymentType,
      channel: "whatsapp",
    });
    router.push("/pedidos/nuevo");
  };

  const messages: ChatMessage[] = [];
  if (text.trim()) {
    messages.push({
      id: "in",
      from: "customer",
      text,
      at: new Date(receivedAt.getTime() - (sample?.minutesAgo ?? 1) * 60_000),
    });
  }
  if (created) {
    messages.push({
      id: "out",
      from: "business",
      text: `¡Listo ${firstName(customer.ownerName)}! Tu pedido ${created.number} por ${formatMoney(created.total)} fue registrado${parsed?.delivery === "today" ? " y sale hoy" : " y llega mañana"}. ¡Gracias por tu compra! 🙌`,
      at: new Date(),
    });
  }
  const highlight = phase === "done" || phase === "confirmed" ? [...(parsed?.lines.map((l) => l.source) ?? []), ...(parsed?.removed.map((r) => r.source) ?? []), parsed?.paymentSource ?? ""].filter((s) => s && s !== "pedido anterior") : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Asistente de pedidos"
        description="Convierte mensajes de tus clientes en pedidos listos para confirmar."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <FlaskConical className="size-3" /> Simulación para demo
          </span>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="sample" className="shrink-0 text-sm font-medium">
          Probar otro mensaje
        </label>
        <NativeSelect id="sample" value={sampleId} onChange={(e) => selectSample(e.target.value)} className="sm:max-w-xl">
          {SAMPLE_MESSAGES.map((m, i) => {
            const c = data.customers.find((x) => x.id === m.customerId);
            return (
              <option key={m.id} value={m.id}>
                {i + 1}. {c?.businessName}: “{m.text.length > 60 ? `${m.text.slice(0, 60)}…` : m.text}”
              </option>
            );
          })}
          <option value={CUSTOM}>✏️ Escribir o pegar un mensaje propio…</option>
        </NativeSelect>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <ChatPanel
            customer={customer}
            messages={messages}
            highlight={highlight}
            footer={
              isCustom ? (
                <div className="space-y-2 border-t border-border bg-[#f0f2f5] p-3">
                  <NativeSelect value={customCustomer} onChange={(e) => { setCustomCustomer(e.target.value); reset(); }} aria-label="Cliente del chat" className="bg-white">
                    {data.customers.slice(0, 40).map((c) => (
                      <option key={c.id} value={c.id}>
                        Chat con: {c.businessName}
                      </option>
                    ))}
                  </NativeSelect>
                  <Textarea
                    rows={3}
                    value={customText}
                    onChange={(e) => { setCustomText(e.target.value); if (phase !== "idle") reset(); }}
                    placeholder="Ej.: mandame 2 docenas de cocas, 3 detergentes y 5 leches, pago contado"
                    className="bg-white"
                  />
                </div>
              ) : null
            }
          />
          <Button size="xl" className="w-full font-semibold tracking-wide uppercase" onClick={interpret} loading={phase === "processing"} disabled={phase === "processing" || !text.trim()}>
            {phase === "processing" ? null : isCustom ? <Send /> : <Sparkles />} Interpretar pedido
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            En producción, los mensajes llegarán directo desde WhatsApp Business. Aquí nada se envía.
          </p>
        </div>

        <div>
          {phase === "idle" && <IdleState />}
          {phase === "processing" && <ProcessingState step={step} />}
          {phase === "done" && parsed && (
            <DetectedOrder
              customer={customer}
              account={account}
              parsed={parsed}
              lines={lines}
              subtotal={subtotal}
              total={total}
              paymentType={paymentType}
              onPaymentType={setPaymentType}
              onQuantity={setQuantity}
              onConfirm={confirm}
              onEdit={edit}
              onDiscard={() => {
                reset();
                toast("Pedido descartado");
              }}
            />
          )}
          {phase === "confirmed" && created && <ConfirmedState order={created} onReset={() => selectSample(SAMPLE_MESSAGES[(SAMPLE_MESSAGES.findIndex((m) => m.id === sampleId) + 1) % SAMPLE_MESSAGES.length].id)} />}
        </div>
      </div>
    </div>
  );
}

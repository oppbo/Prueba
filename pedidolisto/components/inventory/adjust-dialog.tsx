"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { ProductThumb } from "@/components/shared/product-thumb";
import { useDemoStore } from "@/lib/store/demo-store";
import { useData } from "@/lib/store/hooks";
import type { ID } from "@/lib/types";
import type { AdjustInventoryInput } from "@/lib/services/inventory";
import { cn } from "@/lib/utils";

type AdjustType = AdjustInventoryInput["type"];

const TYPES: { value: AdjustType; label: string; hint: string }[] = [
  { value: "in", label: "Ingreso", hint: "Compra o reposición" },
  { value: "out", label: "Salida", hint: "Merma, daño o uso interno" },
  { value: "adjustment", label: "Ajuste", hint: "Conteo físico" },
];

const REASONS: Record<AdjustType, string[]> = {
  in: ["Ingreso de proveedor", "Devolución de cliente", "Traspaso de sucursal"],
  out: ["Producto dañado", "Producto vencido", "Muestra / degustación"],
  adjustment: ["Conteo físico mensual", "Corrección de registro"],
};

export function AdjustInventoryDialog({ productId, onClose }: { productId: ID | null; onClose: () => void }) {
  return (
    <Dialog open={productId !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md">{productId !== null && <AdjustForm initialProductId={productId} onDone={onClose} />}</DialogContent>
    </Dialog>
  );
}

function AdjustForm({ initialProductId, onDone }: { initialProductId: ID; onDone: () => void }) {
  const data = useData();
  const adjust = useDemoStore((s) => s.adjustInventory);
  const [productId, setProductId] = useState(initialProductId || data.products[0].id);
  const [type, setType] = useState<AdjustType>("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(REASONS.in[0]);
  const [submitted, setSubmitted] = useState(false);
  const product = data.products.find((p) => p.id === productId)!;
  const qty = Number(quantity);
  const valid = quantity !== "" && Number.isFinite(qty) && qty >= 0 && (type === "adjustment" || qty > 0);
  const after = !valid ? product.stock : type === "in" ? product.stock + qty : type === "out" ? product.stock - qty : qty;
  const error = !valid ? "Ingresa una cantidad válida." : after < 0 ? `Solo hay ${product.stock} unidades disponibles.` : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (error) return;
    try {
      adjust({ productId, type, quantity: qty, reason });
      toast.success("Inventario actualizado", { description: `${product.name}: ${product.stock} → ${after} unidades` });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo ajustar el inventario.");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
      <DialogHeader>
        <DialogTitle>Ajustar inventario</DialogTitle>
        <DialogDescription>Registra ingresos, salidas o correcciones de stock.</DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <Field id="adj-product" label="Producto">
          <NativeSelect value={productId} onChange={(e) => setProductId(e.target.value)}>
            {data.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.stock})
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Tipo de movimiento</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de movimiento">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={type === t.value}
                onClick={() => {
                  setType(t.value);
                  setReason(REASONS[t.value][0]);
                }}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-colors",
                  type === t.value ? "border-primary bg-primary-soft" : "border-border hover:bg-muted",
                )}
              >
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="adj-qty" label={type === "adjustment" ? "Stock contado" : "Cantidad"} required error={submitted || quantity ? error : undefined}>
            <Input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} placeholder="0" className="h-10 text-base font-semibold tabular" autoFocus />
          </Field>
          <Field id="adj-reason" label="Motivo">
            <NativeSelect value={reason} onChange={(e) => setReason(e.target.value)} className="h-10">
              {REASONS[type].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <ProductThumb product={product} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">Mínimo: {product.minimumStock}</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold tabular">
            <span className="text-muted-foreground">{product.stock}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span className={cn(after < 0 ? "text-destructive" : after <= product.minimumStock ? "text-warning" : "text-success")}>{after}</span>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">Guardar movimiento</Button>
      </DialogFooter>
    </form>
  );
}

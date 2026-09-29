"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ClipboardList, HandCoins, MessageSquareText, Package, Plus, User } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { OrderStatusBadge } from "@/components/shared/status-badges";
import { formatMoney, formatRelativeDay } from "@/lib/format";
import { useLookups, useData, useRole } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { normalizeText } from "@/lib/utils";
import { canAccess } from "./nav-config";

const LIMIT = 6;

export function CommandMenu() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const openPayment = useUiStore((s) => s.openPayment);
  const router = useRouter();
  const data = useData();
  const role = useRole();
  const lookups = useLookups();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const q = normalizeText(query.trim());

  const results = useMemo(() => {
    if (!q) {
      return {
        customers: data.customers.filter((c) => ["c001", "c002", "c003", "c004"].includes(c.id)),
        orders: [...data.orders].slice(-4).reverse(),
        products: [] as typeof data.products,
      };
    }
    const digits = q.replace(/\D/g, "");
    return {
      customers: data.customers
        .filter((c) => normalizeText(`${c.businessName} ${c.ownerName} ${c.zone}`).includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
        .slice(0, LIMIT),
      orders: data.orders
        .filter((o) => {
          if (normalizeText(o.number).includes(q) || (digits.length >= 2 && o.number.endsWith(digits))) return true;
          const c = lookups.customer.get(o.customerId);
          return q.length >= 3 && c ? normalizeText(c.businessName).includes(q) : false;
        })
        .slice(-LIMIT)
        .reverse(),
      products: data.products.filter((p) => normalizeText(`${p.name} ${p.sku} ${p.brand}`).includes(q)).slice(0, LIMIT),
    };
  }, [q, data, lookups]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const actions = [
    { label: "Nuevo pedido", icon: Plus, href: "/pedidos/nuevo" },
    { label: "Asistente de pedidos (WhatsApp)", icon: MessageSquareText, href: "/asistente-pedidos" },
    { label: "Ver pedidos", icon: ClipboardList, href: "/pedidos" },
  ].filter((a) => canAccess(a.href, role));

  const matches = (label: string) => !q || normalizeText(label).includes(q);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setQuery("");
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <DialogPrimitive.Content
          className="fixed top-[12dvh] left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl outline-none data-[state=open]:animate-in"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Búsqueda global</DialogPrimitive.Title>
          <Command shouldFilter={false} loop>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Buscar cliente, pedido o producto..." />
            <CommandList>
              <CommandEmpty>No encontramos resultados para “{query}”.</CommandEmpty>
              {actions.some((a) => matches(a.label)) && (
                <CommandGroup heading="Acciones rápidas">
                  {actions
                    .filter((a) => matches(a.label))
                    .map((a) => (
                      <CommandItem key={a.href} value={a.label} onSelect={() => go(a.href)}>
                        <a.icon />
                        {a.label}
                      </CommandItem>
                    ))}
                  {role === "owner" && matches("Registrar pago") && (
                    <CommandItem
                      value="registrar-pago"
                      onSelect={() => {
                        setOpen(false);
                        openPayment();
                      }}
                    >
                      <HandCoins />
                      Registrar pago
                    </CommandItem>
                  )}
                </CommandGroup>
              )}
              {results.customers.length > 0 && role !== "warehouse" && (
                <CommandGroup heading={q ? "Clientes" : "Clientes frecuentes"}>
                  {results.customers.map((c) => (
                    <CommandItem key={c.id} value={`c-${c.id}`} onSelect={() => go(`/clientes/${c.id}`)}>
                      <User />
                      <span className="min-w-0 flex-1 truncate">{c.businessName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{c.zone}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.orders.length > 0 && (
                <CommandGroup heading={q ? "Pedidos" : "Pedidos recientes"}>
                  {results.orders.map((o) => (
                    <CommandItem key={o.id} value={`o-${o.id}`} onSelect={() => go(`/pedidos/${o.id}`)}>
                      <ClipboardList />
                      <span className="font-medium tabular">{o.number}</span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {lookups.customer.get(o.customerId)?.businessName} · {formatRelativeDay(o.createdAt)}
                      </span>
                      <span className="hidden text-xs tabular sm:inline">{formatMoney(o.total)}</span>
                      <OrderStatusBadge status={o.status} className="hidden sm:inline-flex" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.products.length > 0 && (
                <CommandGroup heading="Productos">
                  {results.products.map((p) => (
                    <CommandItem key={p.id} value={`p-${p.id}`} onSelect={() => go(`/inventario?q=${encodeURIComponent(p.name)}`)}>
                      <Package />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular">
                        {p.stock} en stock · {formatMoney(p.wholesalePrice)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
              <span>↑↓ para navegar · Enter para abrir</span>
              <span>Esc para cerrar</span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { accountStatement } from "@/lib/domain/accounts";
import { formatDate, formatMoney } from "@/lib/format";
import { useData } from "@/lib/store/hooks";
import type { ID } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AccountStatement({ customerId }: { customerId: ID }) {
  const data = useData();
  const rows = useMemo(() => accountStatement(data, customerId).slice(0, 25), [data, customerId]);
  if (!rows.length) return <EmptyState icon={Receipt} title="Sin movimientos de cuenta" description="Este cliente compra al contado." />;

  return (
    <Table>
      <THead>
        <tr>
          <TH>Fecha</TH>
          <TH>Concepto</TH>
          <TH className="text-right">Cargo</TH>
          <TH className="text-right">Abono</TH>
          <TH className="text-right">Saldo</TH>
        </tr>
      </THead>
      <TBody>
        {rows.map((r) => (
          <TR key={r.id}>
            <TD className="whitespace-nowrap text-muted-foreground tabular">{formatDate(r.date)}</TD>
            <TD>
              <div className="flex items-center gap-2">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", r.kind === "payment" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
                  {r.kind === "payment" ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{r.description}</span>
                  {r.reference &&
                    (r.href ? (
                      <Link href={r.href} className="text-xs text-primary tabular hover:underline">
                        {r.reference}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground tabular">{r.reference}</span>
                    ))}
                </span>
              </div>
            </TD>
            <TD className="text-right whitespace-nowrap tabular">{r.charge ? formatMoney(r.charge) : ""}</TD>
            <TD className="text-right whitespace-nowrap text-success tabular">{r.credit ? `−${formatMoney(r.credit)}` : ""}</TD>
            <TD className="text-right font-medium whitespace-nowrap tabular">{formatMoney(r.balance)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

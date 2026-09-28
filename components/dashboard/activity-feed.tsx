import Link from "next/link";
import { Bell, CheckCircle2, FilePlus2, FileText, MessageCircle, Receipt, StickyNote, XCircle } from "lucide-react";
import { EVENT_LABEL } from "@/lib/labels";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CollectionEventType } from "@/types/database";

const ICONS: Record<CollectionEventType, { icon: typeof Bell; className: string }> = {
  reminder_created: { icon: Bell, className: "bg-info-soft text-info-soft-foreground" },
  whatsapp_opened: { icon: MessageCircle, className: "bg-emerald-50 text-emerald-700" },
  note_added: { icon: StickyNote, className: "bg-muted text-zinc-600" },
  payment_proof_received: { icon: Receipt, className: "bg-warning-soft text-warning" },
  payment_verified: { icon: CheckCircle2, className: "bg-primary-soft text-primary" },
  payment_rejected: { icon: XCircle, className: "bg-destructive-soft text-destructive" },
  invoice_created: { icon: FilePlus2, className: "bg-muted text-zinc-600" },
  invoice_updated: { icon: FileText, className: "bg-muted text-zinc-600" },
};

export type TimelineEvent = {
  id: string;
  event_type: CollectionEventType;
  message: string | null;
  created_at: string;
  customer_id?: string;
  customer_name?: string;
  invoice_id?: string | null;
  invoice_number?: string | null;
};

/** Vertical timeline used for dashboard activity and customer/invoice history. */
export function Timeline({ events, showCustomer = false, compact = false }: { events: TimelineEvent[]; showCustomer?: boolean; compact?: boolean }) {
  return (
    <ol className="relative grid gap-4">
      {events.map((e, idx) => {
        const { icon: Icon, className } = ICONS[e.event_type];
        const isLast = idx === events.length - 1;
        const showMessage = e.message && e.event_type !== "whatsapp_opened";
        return (
          <li key={e.id} className="relative flex gap-3">
            {!isLast && <span className="absolute top-8 bottom-[-16px] left-[13px] w-px bg-border" aria-hidden />}
            <span className={cn("relative flex size-7 shrink-0 items-center justify-center rounded-full", className)}>
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm">
                <span className="font-medium">{EVENT_LABEL[e.event_type]}</span>
                {showCustomer && e.customer_name && e.customer_id && (
                  <>
                    {" · "}
                    <Link href={`/dashboard/customers/${e.customer_id}`} className="text-muted-foreground hover:text-foreground hover:underline">
                      {e.customer_name}
                    </Link>
                  </>
                )}
                {e.invoice_number && e.invoice_id && (
                  <>
                    {" · "}
                    <Link href={`/dashboard/invoices/${e.invoice_id}`} className="whitespace-nowrap text-muted-foreground hover:text-foreground hover:underline">
                      {e.invoice_number}
                    </Link>
                  </>
                )}
              </p>
              {showMessage && !compact && <p className="mt-0.5 text-[13px] whitespace-pre-line text-muted-foreground">{e.message}</p>}
              {e.event_type === "whatsapp_opened" && !compact && e.message && (
                <details className="mt-0.5 text-[13px] text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">Ver mensaje</summary>
                  <p className="mt-1 rounded-md bg-muted p-2 whitespace-pre-line">{e.message}</p>
                </details>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(e.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

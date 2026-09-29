"use client";

import { CheckCheck, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { formatTime } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  from: "customer" | "business";
  text: string;
  at: Date;
}

/** WhatsApp-style conversation mock (simulation only, nothing is sent). */
export function ChatPanel({ customer, messages, highlight = [], footer }: { customer: Customer; messages: ChatMessage[]; highlight?: string[]; footer?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-border shadow-xs">
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <Avatar name={customer.businessName} className="size-9 bg-white/15 text-white" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{customer.businessName}</p>
          <p className="truncate text-xs text-white/75">{customer.ownerName} · en línea</p>
        </div>
        <div className="hidden items-center gap-4 text-white/85 sm:flex" aria-hidden>
          <Video className="size-4" />
          <Phone className="size-4" />
          <MoreVertical className="size-4" />
        </div>
      </div>
      <div
        className="flex-1 space-y-2 overflow-y-auto bg-[#efeae2] px-3 py-4 sm:px-5"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
      >
        <p className="mx-auto w-fit rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-600 shadow-sm">HOY</p>
        {messages.map((m) => (
          <div key={m.id} className={cn("flex animate-in", m.from === "business" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-[14.5px] leading-relaxed text-zinc-900 shadow-sm",
                m.from === "business" ? "rounded-tr-none bg-[#d9fdd3]" : "rounded-tl-none bg-white",
              )}
            >
              <p className="whitespace-pre-wrap">{m.from === "customer" ? <Highlighted text={m.text} phrases={highlight} /> : m.text}</p>
              <p className="mt-0.5 flex items-center justify-end gap-1 text-[10.5px] text-zinc-500">
                {formatTime(m.at)}
                {m.from === "business" && <CheckCheck className="size-3.5 text-sky-500" />}
              </p>
            </div>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}

/** Marks the phrases the assistant recognized, matching accents-insensitively. */
function Highlighted({ text, phrases }: { text: string; phrases: string[] }) {
  if (!phrases.length) return <>{text}</>;
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const ranges: [number, number][] = [];
  for (const phrase of phrases) {
    const idx = normalized.indexOf(phrase);
    if (idx >= 0) ranges.push([idx, idx + phrase.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start < cursor) return;
    parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="rounded bg-amber-200/70 px-0.5 text-inherit">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

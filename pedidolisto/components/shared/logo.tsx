import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm", className)} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" className="size-[60%]" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" opacity={0.35} />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
    </span>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="text-[15px] font-semibold tracking-tight">PedidoListo</span>}
    </span>
  );
}

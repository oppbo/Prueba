import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path d="M20.5 11.2a6.5 6.5 0 1 0 0 9.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="m16.6 16 2.2 2.2 4.4-4.6" fill="none" stroke="#9ff0cf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[17px]">
        Cobra<span className="text-primary">Ya</span>
      </span>
    </span>
  );
}

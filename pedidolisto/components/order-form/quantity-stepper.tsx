"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  className,
  size = "default",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  size?: "default" | "sm";
}) {
  const btn = size === "sm" ? "size-8" : "size-10";
  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border bg-card shadow-xs", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className={cn("grid place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted active:bg-zinc-200 disabled:opacity-40", btn)}
        disabled={value <= 0}
        aria-label="Quitar uno"
      >
        <Minus className="size-4" />
      </button>
      <input
        inputMode="numeric"
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Math.min(9999, Number(e.target.value.replace(/\D/g, "")) || 0))}
        onFocus={(e) => e.target.select()}
        className={cn("w-10 bg-transparent text-center text-[15px] font-semibold tabular outline-none placeholder:text-muted-foreground/60", size === "sm" && "w-8 text-sm")}
        aria-label="Cantidad"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={cn("grid place-items-center rounded-r-lg text-primary transition-colors hover:bg-primary-soft active:bg-primary-soft", btn)}
        aria-label="Agregar uno"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

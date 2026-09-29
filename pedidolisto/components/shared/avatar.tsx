import { cn, initials } from "@/lib/utils";

const PALETTE = [
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-800",
  "bg-violet-50 text-violet-700",
  "bg-rose-50 text-rose-700",
  "bg-cyan-50 text-cyan-800",
  "bg-zinc-100 text-zinc-700",
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, className, color }: { name: string; className?: string; color?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
        !color && PALETTE[hash(name) % PALETTE.length],
        className,
      )}
      style={color ? { backgroundColor: `${color}1a`, color } : undefined}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

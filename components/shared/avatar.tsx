import { cn, initials } from "@/lib/utils";

const palette = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, className }: { name: string | null | undefined; className?: string }) {
  const color = palette[hash(name ?? "") % palette.length];
  return (
    <span
      className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", color, className)}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

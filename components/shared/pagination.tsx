import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-[13px] text-muted-foreground">
      <p className="tabular">
        {from}–{to} de {total}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <PageLink disabled={page <= 1} href={hrefFor(page - 1)} label="Página anterior">
            <ChevronLeft />
          </PageLink>
          <span className="tabular px-2">
            {page} / {pages}
          </span>
          <PageLink disabled={page >= pages} href={hrefFor(page + 1)} label="Página siguiente">
            <ChevronRight />
          </PageLink>
        </div>
      )}
    </nav>
  );
}

function PageLink({ disabled, href, label, children }: { disabled: boolean; href: string; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled className={cn(buttonVariants({ variant: "secondary", size: "icon-sm" }), "opacity-40")}>
        {children}
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <Link href={href} className={buttonVariants({ variant: "secondary", size: "icon-sm" })} scroll={false}>
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

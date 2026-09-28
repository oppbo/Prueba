import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Generic page skeleton for list routes. */
export function ListPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="grid gap-6" aria-busy aria-label="Cargando">
      <div className="flex items-end justify-between">
        <div className="grid gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-80 max-w-full" />
      <Card className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-8 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}

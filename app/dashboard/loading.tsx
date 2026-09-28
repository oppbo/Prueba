import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="grid gap-6" aria-busy aria-label="Cargando">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-7 w-36" />
            <Skeleton className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-6 h-60 w-full" />
      </Card>
    </div>
  );
}

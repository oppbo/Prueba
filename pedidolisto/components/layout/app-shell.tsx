"use client";

import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentDialog } from "@/components/collections/payment-dialog";
import { ReminderDialog } from "@/components/collections/reminder-dialog";
import { useDemoStore } from "@/lib/store/demo-store";
import { CommandMenu } from "./command-menu";
import { MobileNav } from "./mobile-nav";
import { RoleGuard } from "./role-guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

function ShellSkeleton() {
  return (
    <div className="min-h-dvh lg:pl-60" aria-busy aria-label="Cargando PedidoListo">
      <div className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-sidebar p-4 lg:block">
        <Skeleton className="h-8 w-36" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useDemoStore((s) => s.hydrated);
  const hydrate = useDemoStore((s) => s.hydrate);
  const refreshed = useDemoStore((s) => s.refreshedForToday);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (refreshed) toast.info("Datos de demostración actualizados al día de hoy");
  }, [refreshed]);

  if (!hydrated) return <ShellSkeleton />;

  return (
    <div className="min-h-dvh lg:pl-60">
      <Sidebar />
      <Topbar />
      <main className="mx-auto max-w-[1400px] px-4 pt-5 pb-28 sm:px-6 sm:pt-7 lg:px-8 lg:pb-12">
        <RoleGuard>
          <Suspense fallback={null}>{children}</Suspense>
        </RoleGuard>
      </main>
      <MobileNav />
      <CommandMenu />
      <PaymentDialog />
      <ReminderDialog />
    </div>
  );
}

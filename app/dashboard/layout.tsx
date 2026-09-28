import type { Metadata } from "next";
import Link from "next/link";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Logo } from "@/components/shared/logo";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { resolveTemplates } from "@/lib/whatsapp";
import { ReminderProvider } from "@/components/collections/reminder-context";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · CobraYa" }, robots: { index: false } };

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireSession();
  const supabase = await createClient();
  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("status", "pending_verification");

  const shell = {
    organizationName: session.organization.name,
    userName: session.fullName,
    email: session.email,
    role: session.role,
    pendingPayments: count ?? 0,
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow">
        Saltar al contenido
      </a>
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-card lg:block">
        <SidebarContent {...shell} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/90 px-4 backdrop-blur lg:hidden">
          <MobileNav
            organizationName={shell.organizationName}
            pendingPayments={shell.pendingPayments}
            userMenu={<UserMenu name={shell.userName} email={shell.email} role={shell.role} />}
          />
          <Link href="/dashboard" aria-label="Inicio">
            <Logo />
          </Link>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <ReminderProvider
            value={{ organizationName: session.organization.name, templates: resolveTemplates(session.organization.reminder_templates) }}
          >
            {children}
          </ReminderProvider>
        </main>
      </div>
    </div>
  );
}

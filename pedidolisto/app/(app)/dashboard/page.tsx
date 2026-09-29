"use client";

import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { SellerDashboard } from "@/components/dashboard/seller-dashboard";
import { useRole } from "@/lib/store/hooks";

export default function DashboardPage() {
  const role = useRole();
  return role === "seller" ? <SellerDashboard /> : <OwnerDashboard />;
}

"use client";

import { AdminTopBar } from "./admin-topbar";
import { usePathname } from "next/navigation";

// Maps route segments → human-readable titles (matches PDF header labels)
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard/admin":           "Dashboard",
  "/dashboard/admin/products":  "Product Management",
  "/dashboard/admin/stock":     "Stock Monitoring",
  "/dashboard/admin/reports":   "Reports",
  "/dashboard/admin/alerts":    "Alerts",
  "/dashboard/admin/pos":       "POS / Sales",
  "/dashboard/admin/suppliers": "Supplier Portal",
  "/dashboard/admin/settings":  "Settings",
};

export function AdminTopBarInjector({ alertCount }: { alertCount: number }) {
  const pathname = usePathname();

  // Find the longest matching prefix
  const title =
    Object.entries(ROUTE_TITLES)
      .filter(([route]) => pathname.startsWith(route))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Dashboard";

  return <AdminTopBar title={title} alertCount={alertCount} />;
}

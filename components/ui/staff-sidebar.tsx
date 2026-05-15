"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Bell,
  Search,
  LogOut,
  ShoppingBasket,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAFF_NAV = [
  { label: "Dashboard",        href: "/dashboard/staff",          icon: LayoutDashboard },
  { label: "POS / Sales",      href: "/dashboard/staff/pos",      icon: ShoppingCart    },
  { label: "Stock Monitoring", href: "/dashboard/staff/stock",    icon: ClipboardList   },
  { label: "Alerts",           href: "/dashboard/staff/alerts",   icon: Bell            },
  { label: "Product Lookup", href: "/dashboard/staff/product-lookup", icon: Search },

];

export function StaffSidebar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/dashboard/staff") return pathname === "/dashboard/staff";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShoppingBasket size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-logo-text">Vine's Store</div>
          <div className="sidebar-logo-sub">Inventory Management</div>
        </div>
      </div>

      {/* Role badge */}
      <div className="sidebar-role-badge" style={{ color: "#60a5fa" }}>
        Staff Panel
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>

        {STAFF_NAV.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          const badge  = item.label === "Alerts" && alertCount > 0 ? alertCount : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", active && "active")}
            >
              <Icon className="sidebar-link-icon" size={18} />
              <span>{item.label}</span>
              {badge !== undefined && (
                <span className="sidebar-badge">{badge}</span>
              )}
              {active && !badge && (
                <ChevronRight size={14} className="ml-auto opacity-60" style={{ color: "inherit" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User row */}
        {session?.user && (
          <div style={{
            padding: "8px 10px", marginBottom: 4,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#1d4ed8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {session.user.name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 600, color: "#e2e8f0",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {session.user.name}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--sidebar-text)" }}>
                staff
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
        >
          <LogOut className="sidebar-link-icon" size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

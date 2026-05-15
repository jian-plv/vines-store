"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BarChart2,
  Bell,
  ShoppingCart,
  Truck,
  Settings,
  LogOut,
  ShoppingBasket,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav Item Types ────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Product Management",
    href: "/dashboard/admin/products",
    icon: Package,
    adminOnly: true,
  },
  {
    label: "Stock Monitoring",
    href: "/dashboard/admin/stock",
    icon: ClipboardList,
  },
  {
    label: "Reports",
    href: "/dashboard/admin/reports",
    icon: BarChart2,
    adminOnly: true,
  },
  {
    label: "Alerts",
    href: "/dashboard/admin/alerts",
    icon: Bell,
  },
  {
    label: "POS / Sales",
    href: "/dashboard/admin/pos",
    icon: ShoppingCart,
  },
  {
    label: "Supplier Portal",
    href: "/dashboard/admin/suppliers",
    icon: Truck,
    adminOnly: true,
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    label: "Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
    adminOnly: true,
  },
];

// ─── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") return pathname === "/dashboard/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShoppingBasket size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-logo-text">Vine's Store</div>
          <div className="sidebar-logo-sub">Inventory Management</div>
        </div>
      </div>

      {/* ── Role Badge ── */}
      <div className="sidebar-role-badge">
        {isAdmin ? "Admin Panel" : "Staff Panel"}
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Main Menu</div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const badge = item.label === "Alerts" && alertCount > 0 ? alertCount : undefined;

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
                <ChevronRight
                  size={14}
                  className="ml-auto opacity-60"
                  style={{ color: "inherit" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        {BOTTOM_ITEMS.filter((i) => !i.adminOnly || isAdmin).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", active && "active")}
            >
              <Icon className="sidebar-link-icon" size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* User Row */}
        {session?.user && (
          <div
            style={{
              padding: "8px 10px",
              marginTop: 4,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--brand-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {session.user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#e2e8f0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.user.name}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--sidebar-text)" }}>
                {session.user.role?.toLowerCase()}
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

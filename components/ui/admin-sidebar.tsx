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
  ChevronRight,
} from "lucide-react";

// ─── Nav structure ─────────────────────────────────────────────────────────────

interface NavItem {
  label:     string;
  href:      string;
  icon:      React.ElementType;
  alertKey?: true;          // shows the live alertCount badge
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",          href: "/dashboard/admin",           icon: LayoutDashboard },
  { label: "Product Management", href: "/dashboard/admin/products",  icon: Package         },
  { label: "Stock Monitoring",   href: "/dashboard/admin/stock",     icon: ClipboardList   },
  { label: "Reports",            href: "/dashboard/admin/reports",   icon: BarChart2       },
  { label: "Alerts",             href: "/dashboard/admin/alerts",    icon: Bell, alertKey: true },
  { label: "POS / Sales",        href: "/dashboard/admin/pos",       icon: ShoppingCart    },
  { label: "Supplier Portal",    href: "/dashboard/admin/suppliers", icon: Truck           },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSidebar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const active = (href: string) =>
    href === "/dashboard/admin"
      ? pathname === "/dashboard/admin"
      : pathname.startsWith(href);

  return (
    <>
      {/* ── Sidebar shell ───────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 230,
          background: "#0f172a",
          minHeight: "100vh",
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* ── Logo row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 16px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* VS badge */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: "-0.02em" }}>
              VS
            </span>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
              Vine's Store
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 400, lineHeight: 1, marginTop: 2 }}>
              Admin Panel
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ padding: "10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const Icon    = item.icon;
            const isActive = active(item.href);
            const badge   = item.alertKey && alertCount > 0 ? alertCount : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 10px",
                  borderRadius: 8,
                  textDecoration: "none",
                  background: isActive ? "#16a34a" : "transparent",
                  color:      isActive ? "#fff"    : "#94a3b8",
                  fontWeight: isActive ? 600       : 450,
                  fontSize: 13,
                  transition: "all 0.13s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "#1e293b";
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color      = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color      = "#94a3b8";
                }}
              >
                <Icon size={17} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>

                {/* Red alert badge */}
                {badge > 0 && (
                  <span
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 800,
                      lineHeight: 1,
                      padding: "2px 6px",
                      borderRadius: 99,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {badge}
                  </span>
                )}

                {/* Active chevron (when no badge) */}
                {isActive && badge === 0 && (
                  <ChevronRight size={13} style={{ opacity: 0.7, flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Settings */}
          <Link
            href="/dashboard/admin/settings"
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "9px 10px", borderRadius: 8, textDecoration: "none",
              color: "#94a3b8", fontSize: 13, fontWeight: 450,
              background: pathname.startsWith("/dashboard/admin/settings") ? "#16a34a" : "transparent",
              transition: "all 0.13s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "#1e293b";
              (e.currentTarget as HTMLAnchorElement).style.color      = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                pathname.startsWith("/dashboard/admin/settings") ? "#16a34a" : "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color =
                pathname.startsWith("/dashboard/admin/settings") ? "#fff" : "#94a3b8";
            }}
          >
            <Settings size={17} style={{ opacity: 0.7 }} />
            <span>Settings</span>
          </Link>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "9px 10px", borderRadius: 8,
              background: "transparent", border: "none", cursor: "pointer",
              color: "#94a3b8", fontSize: 13, fontWeight: 450,
              width: "100%", textAlign: "left",
              transition: "all 0.13s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#1e293b";
              (e.currentTarget as HTMLButtonElement).style.color      = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color      = "#94a3b8";
            }}
          >
            <LogOut size={17} style={{ opacity: 0.7 }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

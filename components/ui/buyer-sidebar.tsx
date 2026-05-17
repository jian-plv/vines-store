"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, ShoppingBag, LogOut,
  ShoppingBasket, ChevronRight, Menu, X,
} from "lucide-react";
import { useState } from "react";

const BUYER_NAV = [
  { label: "Home",            href: "/dashboard/buyer",          icon: LayoutDashboard },
  { label: "Product Catalog", href: "/dashboard/buyer/products", icon: ShoppingBag     },
];

export function BuyerSidebar() {
  const pathname          = usePathname();
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard/buyer") return pathname === "/dashboard/buyer";
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div style={{
      width: 230, background: "#0f172a",
      height: "100%", display: "flex",
      flexDirection: "column", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#16a34a",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
          }}>
            <ShoppingBasket size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "#fff", lineHeight: 1.25 }}>
              Vine's Store
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
              Customer Portal
            </div>
          </div>
        </div>

        {/* Close button — mobile only */}
        <button onClick={() => setOpen(false)}
          className="sidebar-close-btn"
          style={{
            display: "none", background: "none", border: "none",
            cursor: "pointer", color: "#64748b", padding: 4,
          }}>
          <X size={20} />
        </button>
      </div>

      {/* Role badge */}
      <div style={{
        margin: "10px 16px", padding: "6px 10px",
        background: "rgba(255,255,255,0.05)", borderRadius: 6,
        fontSize: 11, color: "#60a5fa", fontWeight: 600,
        letterSpacing: "0.05em", textTransform: "uppercase",
      }}>
        Customer
      </div>

      {/* Navigation */}
      <nav style={{
        padding: "8px 10px", flex: 1,
        display: "flex", flexDirection: "column", gap: 2, overflowY: "auto",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "rgba(148,163,184,0.45)",
          padding: "12px 6px 4px",
        }}>
          Navigation
        </div>

        {BUYER_NAV.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 10px", borderRadius: 8,
                textDecoration: "none",
                background: active ? "#16a34a" : "transparent",
                color:      active ? "#fff"    : "#94a3b8",
                fontWeight: active ? 600       : 450,
                fontSize: 13, transition: "all 0.13s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#1e293b";
                  (e.currentTarget as HTMLAnchorElement).style.color      = "#e2e8f0";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color      = "#94a3b8";
                }
              }}
            >
              <Icon size={17} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <ChevronRight size={13} style={{ opacity: 0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "10px", display: "flex",
        flexDirection: "column", gap: 2, flexShrink: 0,
      }}>
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
              {session.user.name?.[0]?.toUpperCase() ?? "C"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 600, color: "#e2e8f0",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {session.user.name}
              </div>
              <div style={{ fontSize: 10.5, color: "#64748b" }}>customer</div>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "9px 10px", borderRadius: 8,
            background: "transparent", border: "none",
            cursor: "pointer", color: "#94a3b8",
            fontSize: 13, fontWeight: 450,
            width: "100%", textAlign: "left",
            fontFamily: "DM Sans, sans-serif", transition: "all 0.13s",
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
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar"
        style={{
          width: 230, background: "#0f172a",
          minHeight: "100vh", position: "fixed",
          top: 0, left: 0, bottom: 0,
          display: "flex", flexDirection: "column",
          zIndex: 40, overflowY: "auto", overflowX: "hidden",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="hamburger-btn"
        style={{
          display: "none",
          position: "fixed", top: 12, left: 12,
          zIndex: 50,
          width: 40, height: 40, borderRadius: 10,
          background: "#0f172a", border: "none",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 49,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="mobile-drawer"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 230, zIndex: 50,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          display: "none",
        }}
      >
        <SidebarContent />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar  { display: none !important; }
          .hamburger-btn    { display: flex !important; }
          .mobile-drawer    { display: block !important; }
          .sidebar-close-btn{ display: flex !important; }
        }
      `}</style>
    </>
  );
}
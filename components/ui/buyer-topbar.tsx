"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard/buyer":          "Home",
  "/dashboard/buyer/products": "Product Catalog",
};

export function BuyerTopBar() {
  const { data: session }  = useSession();
  const pathname           = usePathname();
  const [dropOpen, setDrop] = useState(false);
  const dropRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const title =
    Object.entries(ROUTE_TITLES)
      .filter(([route]) => pathname.startsWith(route))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Home";

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 56,
      background: "#fff", borderBottom: "1px solid #e2e8f0",
      position: "sticky", top: 0, zIndex: 30,
    }}>
      {/* Left: × Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, color: "#94a3b8", cursor: "default",
          userSelect: "none", fontWeight: 400,
        }}>×</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", letterSpacing: "-0.01em" }}>
          {title}
        </span>
      </div>

      {/* Right: User dropdown */}
      <div ref={dropRef} style={{ position: "relative" }}>
        <button
          onClick={() => setDrop((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "5px 10px 5px 6px",
            borderRadius: 8, border: "1px solid #e2e8f0",
            background: dropOpen ? "#f1f5f9" : "#fff",
            cursor: "pointer", transition: "all 0.13s",
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "#2563eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "C"}
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
            {session?.user?.name ?? "Customer"}
          </span>
          <ChevronDown size={13} color="#94a3b8"
            style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
        </button>

        {/* Dropdown */}
        {dropOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            minWidth: 180, background: "#fff",
            border: "1px solid #e2e8f0", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            overflow: "hidden", zIndex: 50,
          }}>
            <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {session?.user?.name ?? "Customer"}
              </div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
                {session?.user?.email ?? "buyer@vine.com"}
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 14px", width: "100%",
                background: "none", border: "none", cursor: "pointer",
                color: "#dc2626", fontSize: 13, fontWeight: 500,
                fontFamily: "DM Sans, sans-serif", textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#fef2f2")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
            >
              <LogOut size={14} color="#dc2626" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

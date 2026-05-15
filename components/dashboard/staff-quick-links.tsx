"use client";

import Link from "next/link";
import {
  ShoppingCart, ClipboardList,
  Bell, Search, ArrowRight,
} from "lucide-react";
import { useState } from "react";

const STAFF_LINKS = [
  {
    label:    "POS / Sales",
    href:     "/dashboard/staff/pos",
    icon:     ShoppingCart,
    desc:     "Process customer transactions & print receipts",
    accent:   "#16a34a",
    accentBg: "#dcfce7",
  },
  {
    label:    "Stock Monitoring",
    href:     "/dashboard/staff/stock",
    icon:     ClipboardList,
    desc:     "Record stock-in and stock-out movements",
    accent:   "#2563eb",
    accentBg: "#dbeafe",
  },
  {
    label:    "Alerts",
    href:     "/dashboard/staff/alerts",
    icon:     Bell,
    desc:     "View low-stock and near-expiry notifications",
    accent:   "#ea580c",
    accentBg: "#ffedd5",
  },
  {
    label:    "Product Lookup",
    href:     "/dashboard/staff/products",
    icon:     Search,
    desc:     "Check stock levels, prices & shelf location",
    accent:   "#7c3aed",
    accentBg: "#ede9fe",
  },
];

function StaffCard({
  label, href, icon: Icon, desc, accent, accentBg,
}: typeof STAFF_LINKS[0]) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   "#fff",
          border:       `1px solid ${hovered ? accent : "#e2e8f0"}`,
          borderRadius: 14,
          padding:      "24px",
          display:      "flex",
          flexDirection:"column",
          gap:          14,
          transition:   "all 0.15s ease",
          cursor:       "pointer",
          boxShadow:    hovered ? `0 4px 16px ${accent}22` : "none",
          transform:    hovered ? "translateY(-2px)" : "none",
          height:       "100%",
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: accentBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={22} color={accent} />
        </div>

        <div>
          <div style={{
            fontSize: 16, fontWeight: 700, color: "#0f172a",
            marginBottom: 5, letterSpacing: "-0.01em",
          }}>
            {label}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
            {desc}
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 13, fontWeight: 600,
          color: accent, marginTop: "auto",
        }}>
          Open <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

export function StaffQuickLinks() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 16,
    }}>
      {STAFF_LINKS.map((link) => (
        <StaffCard key={link.href} {...link} />
      ))}
    </div>
  );
}
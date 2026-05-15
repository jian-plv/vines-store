"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";

export function BuyerHomeClient() {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Browse catalog card */}
      <Link href="/dashboard/buyer/products" style={{ textDecoration: "none" }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background:   "#fff",
            border:       `1px solid ${hovered ? "#2563eb" : "#e2e8f0"}`,
            borderRadius: 14,
            padding:      "24px 28px",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            boxShadow:    hovered ? "0 4px 16px rgba(37,99,235,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
            transform:    hovered ? "translateY(-2px)" : "none",
            transition:   "all 0.15s ease",
            cursor:       "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "#dbeafe",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShoppingBag size={26} color="#2563eb" strokeWidth={2} />
            </div>
            <div>
              <div style={{
                fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4,
              }}>
                Browse Product Catalog
              </div>
              <div style={{ fontSize: 13.5, color: "#64748b" }}>
                View all available grocery products, prices, and stock levels
              </div>
            </div>
          </div>
          <ArrowRight size={20} color="#94a3b8" />
        </div>
      </Link>

      {/* Info notice */}
      <div style={{
        marginTop: 20,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 10,
        padding: "14px 18px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13.5,
        color: "#166534",
      }}>
        <span style={{ fontSize: 18 }}>ℹ️</span>
        <div>
          <strong>View-only access.</strong> As a customer, you can browse
          products and check availability. To purchase, please visit our store
          in person or contact staff.
        </div>
      </div>
    </>
  );
}
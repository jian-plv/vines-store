"use client";

import { Package, DollarSign, AlertTriangle, Clock } from "lucide-react";

interface Props {
  totalProducts:   number;
  totalStockValue: number;
  lowStockCount:   number;
  nearExpiryCount: number;
}

export function DashboardSummaryCards({
  totalProducts,
  totalStockValue,
  lowStockCount,
  nearExpiryCount,
}: Props) {
  const cards = [
    {
      label:    "Total Products",
      value:    totalProducts.toString(),
      sub:      "registered items",
      icon:     Package,
      iconBg:   "#dbeafe",
      iconClr:  "#2563eb",
      trend:    null,
    },
    {
      label:    "Total Stock Value",
      value:    `₱${totalStockValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      sub:      "current inventory value",
      icon:     DollarSign,
      iconBg:   "#dcfce7",
      iconClr:  "#16a34a",
      trend:    null,
    },
    {
      label:    "Low Stock Items",
      value:    lowStockCount.toString(),
      sub:      lowStockCount > 0 ? "need restocking" : "all stocked",
      icon:     AlertTriangle,
      iconBg:   "#ffedd5",
      iconClr:  "#ea580c",
      urgent:   lowStockCount > 0,
    },
    {
      label:    "Near Expiry",
      value:    nearExpiryCount.toString(),
      sub:      nearExpiryCount > 0 ? "expiring within 7 days" : "no expiry alerts",
      icon:     Clock,
      iconBg:   "#fef3c7",
      iconClr:  "#d97706",
      urgent:   nearExpiryCount > 0,
    },
  ] as const;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "18px 20px",
              transition: "box-shadow 0.18s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 4px 14px rgba(0,0,0,0.07)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")
            }
          >
            {/* Subtle background accent for urgent cards */}
            {"urgent" in card && card.urgent && (
              <div
                style={{
                  position: "absolute",
                  top: 0, right: 0,
                  width: 80, height: 80,
                  borderRadius: "0 12px 0 100%",
                  background: card.iconBg,
                  opacity: 0.4,
                }}
              />
            )}

            {/* Icon */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: card.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Icon size={20} color={card.iconClr} strokeWidth={2} />
            </div>

            {/* Value */}
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 5,
              }}
            >
              {card.value}
            </div>

            {/* Label */}
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 2,
              }}
            >
              {card.label}
            </div>

            {/* Sub */}
            <div
              style={{
                fontSize: 11.5,
                color:
                  "urgent" in card && card.urgent
                    ? card.iconClr
                    : "#94a3b8",
                fontWeight: "urgent" in card && card.urgent ? 600 : 400,
              }}
            >
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}

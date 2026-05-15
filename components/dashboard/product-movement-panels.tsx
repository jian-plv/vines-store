"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface ProductMovementRow {
  id:           string;
  name:         string;
  category:     string;
  soldQty:      number;
  currentStock: number;
  price:        string;     // serialized Decimal
}

// ─── Single panel ──────────────────────────────────────────────────────────────

function MovementPanel({
  title,
  icon,
  accentColor,
  accentBg,
  rows,
  emptyLabel,
}: {
  title:       string;
  icon:        React.ReactNode;
  accentColor: string;
  accentBg:    string;
  rows:        ProductMovementRow[];
  emptyLabel:  string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px 12px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>

      {/* Row list */}
      {rows.length === 0 ? (
        <div
          style={{
            padding: "32px 18px",
            textAlign: "center",
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          {emptyLabel}
        </div>
      ) : (
        <div>
          {rows.map((row, idx) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 18px",
                borderBottom: idx < rows.length - 1 ? "1px solid #f8fafc" : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background = "#fafafa")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.background = "transparent")
              }
            >
              {/* Rank circle */}
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: accentBg,
                  color: accentColor,
                  fontSize: 11,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>

              {/* Product name + category */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.name}
                </div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
                  {row.category}
                </div>
              </div>

              {/* Sold + stock */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: accentColor,
                  }}
                >
                  {row.soldQty} sold
                </div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
                  {row.currentStock} in stock
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: "10px 18px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Link
          href="/dashboard/admin/reports"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#16a34a",
            textDecoration: "none",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")
          }
        >
          View full report →
        </Link>
      </div>
    </div>
  );
}

// ─── Exported component ────────────────────────────────────────────────────────

export function ProductMovementPanels({
  fastMoving,
  slowMoving,
}: {
  fastMoving: ProductMovementRow[];
  slowMoving: ProductMovementRow[];
}) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <MovementPanel
        title="Fast-Moving Products"
        icon={<TrendingUp size={16} color="#16a34a" strokeWidth={2.5} />}
        accentColor="#16a34a"
        accentBg="#dcfce7"
        rows={fastMoving}
        emptyLabel="No sales data yet — process some sales in POS."
      />
      <MovementPanel
        title="Slow-Moving Products"
        icon={<TrendingDown size={16} color="#ea580c" strokeWidth={2.5} />}
        accentColor="#ea580c"
        accentBg="#ffedd5"
        rows={slowMoving}
        emptyLabel="No slow-moving products identified."
      />
    </div>
  );
}

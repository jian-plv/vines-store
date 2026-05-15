import { TrendingUp, TrendingDown } from "lucide-react";
import type { Product, Category } from "@prisma/client";

type ProductWithCategory = Product & { category: Category };

interface Props {
  fastMoving: { product: ProductWithCategory; sold: number }[];
  slowMoving: { product: ProductWithCategory; sold: number }[];
}

export function FastSlowProducts({ fastMoving, slowMoving }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Fast Moving */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: 14,
            color: "var(--text-primary)",
          }}
        >
          <TrendingUp size={16} color="var(--status-normal)" />
          Fast-Moving Products
        </div>
      </div>

      <div style={{ padding: "8px 0" }}>
        {fastMoving.map((item, i) => (
          <ProductRow
            key={item.product.id}
            rank={i + 1}
            product={item.product}
            sold={item.sold}
            type="fast"
          />
        ))}
        {fastMoving.length === 0 && (
          <EmptyRow message="No sales data yet" />
        )}
      </div>

      {/* Slow Moving */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: 14,
            color: "var(--text-primary)",
          }}
        >
          <TrendingDown size={16} color="var(--status-low)" />
          Slow-Moving Products
        </div>
      </div>

      <div style={{ padding: "8px 0" }}>
        {slowMoving.map((item, i) => (
          <ProductRow
            key={item.product.id}
            rank={i + 1}
            product={item.product}
            sold={item.sold}
            type="slow"
          />
        ))}
        {slowMoving.length === 0 && (
          <EmptyRow message="No sales data yet" />
        )}
      </div>
    </div>
  );
}

function ProductRow({
  rank,
  product,
  sold,
  type,
}: {
  rank: number;
  product: ProductWithCategory;
  sold: number;
  type: "fast" | "slow";
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 20px",
        gap: 14,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "transparent")
      }
    >
      {/* Rank */}
      <span
        style={{
          width: 22,
          height: 22,
          background: type === "fast" ? "var(--brand-100)" : "#fee2e2",
          color: type === "fast" ? "var(--brand-700)" : "#dc2626",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      {/* Product info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
          {product.category.name}
        </div>
      </div>

      {/* Right side */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: type === "fast" ? "var(--brand-700)" : "#dc2626",
          }}
        >
          {sold} sold
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
          {product.currentStock} in stock
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}

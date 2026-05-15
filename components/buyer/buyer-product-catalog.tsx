"use client";

import { useState } from "react";
import {
  Search, Package, Tag, CheckCircle2,
  AlertTriangle, Clock, XCircle, Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuyerProduct = {
  id:              string;
  name:            string;
  category:        string;
  price:           string;
  currentStock:    number;
  status:          string;          // ← string, not ProductStatus enum
  imageUrl:        string | null;   // ← string | null, not just null
  isDiscounted:    boolean;
  originalPrice:   string | null;   // ← string | null, not just null
  discountPercent: number | null;   // ← number | null, not just null
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string; icon: React.ElementType;
  bg: string; color: string; border: string;
}> = {
  NORMAL:      { label: "In Stock",    icon: CheckCircle2,  bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  LOW:         { label: "Low Stock",   icon: AlertTriangle, bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  NEAR_EXPIRY: { label: "Near Expiry", icon: Clock,         bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  EXPIRED:     { label: "Expired",     icon: XCircle,       bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

// ─── Category emoji ───────────────────────────────────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  "Dairy":        "🥛", "Bakery":       "🍞",
  "Poultry":      "🥚", "Grains":       "🌾",
  "Condiments":   "🫙", "Beverages":    "🧃",
  "Canned Goods": "🥫", "Personal Care":"🧴",
  "Frozen":       "🧊",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function BuyerProductCatalog({ products }: { products: BuyerProduct[] }) {
  const [search,         setSearch]         = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus,   setFilterStatus]   = useState("ALL");
  const [view,           setView]           = useState<"grid" | "list">("grid");

  // ── Unique categories ──────────────────────────────────────────────────────
  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category))).sort()];

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "ALL" || p.category === filterCategory;
    const matchStatus   = filterStatus   === "ALL" || p.status   === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const inStockCount    = filtered.filter((p) => p.currentStock > 0).length;
  const discountedCount = filtered.filter((p) => p.isDiscounted).length;

  return (
    <div style={{ padding: 24 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.03em", margin: "0 0 4px" }}>
          Product Catalog
        </h1>
        <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
          Browse all available grocery products · {filtered.length} items shown
          {discountedCount > 0 && (
            <span style={{ marginLeft: 8, background: "#fef3c7", color: "#b45309",
              padding: "2px 8px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
              🏷️ {discountedCount} on sale
            </span>
          )}
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>

        {/* Row 1: Search + view toggle */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} style={{
              position: "absolute", left: 11, top: "50%",
              transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none",
            }} />
            <input
              style={{
                width: "100%", padding: "9px 12px 9px 34px",
                border: "1px solid #e2e8f0", borderRadius: 8,
                fontSize: 13.5, fontFamily: "DM Sans, sans-serif",
                color: "#0f172a", background: "#fff", outline: "none",
                boxSizing: "border-box", transition: "border-color 0.14s, box-shadow 0.14s",
              }}
              placeholder="Search products or categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow   = "none";
              }}
            />
          </div>

          {/* Grid / List toggle */}
          <div style={{
            display: "flex", border: "1px solid #e2e8f0",
            borderRadius: 8, overflow: "hidden",
          }}>
            {(["grid", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  padding: "8px 14px", border: "none",
                  background: view === v ? "#0f172a" : "#fff",
                  color:      view === v ? "#fff"    : "#64748b",
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "DM Sans, sans-serif",
                  cursor: "pointer", transition: "all 0.12s",
                }}>
                {v === "grid" ? "⊞ Grid" : "☰ List"}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Category tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5,
            fontSize: 12.5, color: "#94a3b8", marginRight: 4 }}>
            <Filter size={13} /> Filter:
          </span>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              style={{
                padding: "5px 12px", borderRadius: 99,
                border: "1px solid",
                borderColor: filterCategory === cat ? "#2563eb" : "#e2e8f0",
                background:  filterCategory === cat ? "#2563eb" : "#fff",
                color:       filterCategory === cat ? "#fff"    : "#64748b",
                fontSize: 12.5, fontWeight: filterCategory === cat ? 700 : 500,
                fontFamily: "DM Sans, sans-serif", cursor: "pointer",
                transition: "all 0.12s",
              }}>
              {cat === "ALL" ? "All Categories" : `${CAT_EMOJI[cat] ?? "📦"} ${cat}`}
            </button>
          ))}
        </div>

        {/* Row 3: Status filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { key: "ALL",        label: "All Status"  },
            { key: "NORMAL",     label: "✅ In Stock"  },
            { key: "LOW",        label: "⚠️ Low Stock" },
            { key: "NEAR_EXPIRY",label: "⏱️ Near Expiry"},
          ].map((s) => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)}
              style={{
                padding: "4px 11px", borderRadius: 99,
                border: "1px solid",
                borderColor: filterStatus === s.key ? "#374151" : "#e2e8f0",
                background:  filterStatus === s.key ? "#374151" : "#fff",
                color:       filterStatus === s.key ? "#fff"    : "#64748b",
                fontSize: 12, fontWeight: filterStatus === s.key ? 700 : 400,
                fontFamily: "DM Sans, sans-serif", cursor: "pointer",
                transition: "all 0.12s",
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div style={{
          padding: "60px 24px", textAlign: "center",
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 12, color: "#94a3b8",
        }}>
          <Package size={40} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            No products found
          </div>
          <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {view === "grid" && filtered.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === "list" && filtered.length > 0 && (
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 12, overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 100px 110px",
            gap: 0,
            background: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
          }}>
            {["PRODUCT", "CATEGORY", "PRICE", "STOCK", "STATUS"].map((h) => (
              <div key={h} style={{
                padding: "10px 16px",
                fontSize: 10.5, fontWeight: 700,
                letterSpacing: "0.07em", textTransform: "uppercase",
                color: "#94a3b8",
              }}>{h}</div>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map((p, idx) => (
            <ProductListRow
              key={p.id}
              product={p}
              isLast={idx === filtered.length - 1}
            />
          ))}
        </div>
      )}

      {/* ── Results count ── */}
      {filtered.length > 0 && (
        <div style={{
          marginTop: 16, textAlign: "center",
          fontSize: 12.5, color: "#94a3b8",
        }}>
          Showing {filtered.length} of {products.length} products
          {inStockCount < filtered.length && (
            <span style={{ marginLeft: 8, color: "#c2410c", fontWeight: 600 }}>
              · {filtered.length - inStockCount} out of stock
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Product Grid Card ────────────────────────────────────────────────────────

function ProductCard({ product: p }: { product: BuyerProduct }) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.NORMAL;
  const Icon = cfg.icon;
  const outOfStock = p.currentStock < 1;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hovered ? "#2563eb" : "#e2e8f0"}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "all 0.15s ease",
        boxShadow: hovered ? "0 4px 14px rgba(37,99,235,0.12)" : "none",
        transform: hovered ? "translateY(-2px)" : "none",
        opacity: outOfStock ? 0.6 : 1,
        position: "relative",
      }}
    >
      {/* Discount badge */}
      {p.isDiscounted && p.discountPercent && (
        <div style={{
          position: "absolute", top: 8, right: 8, zIndex: 2,
          background: "#d97706", color: "#fff",
          fontSize: 10.5, fontWeight: 800,
          padding: "3px 7px", borderRadius: 99,
        }}>
          -{p.discountPercent}% OFF
        </div>
      )}

      {/* Image / emoji */}
      <div style={{
        height: 110, background: "#f8fafc",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: "1px solid #f1f5f9", overflow: "hidden",
      }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 44 }}>
            {CAT_EMOJI[p.category] ?? "🛒"}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 14px 12px" }}>
        {/* Category pill */}
        <div style={{
          fontSize: 10.5, fontWeight: 600, color: "#64748b",
          background: "#f1f5f9", padding: "2px 7px",
          borderRadius: 99, display: "inline-block", marginBottom: 6,
        }}>
          {p.category}
        </div>

        {/* Name */}
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: "#0f172a",
          marginBottom: 8, lineHeight: 1.35,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {p.name}
        </div>

        {/* Price */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 18, fontWeight: 800,
            color: p.isDiscounted ? "#15803d" : "#0f172a",
            letterSpacing: "-0.02em",
          }}>
            ₱{parseFloat(p.price).toFixed(2)}
          </span>
          {p.isDiscounted && p.originalPrice && (
            <span style={{
              marginLeft: 7, fontSize: 12, color: "#94a3b8",
              textDecoration: "line-through",
            }}>
              ₱{parseFloat(p.originalPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Status + stock */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11.5, fontWeight: 700,
            background: cfg.bg, color: cfg.color,
            padding: "3px 8px", borderRadius: 99,
            border: `1px solid ${cfg.border}`,
          }}>
            <Icon size={11} strokeWidth={2.5} />
            {outOfStock ? "Out of Stock" : cfg.label}
          </span>
          <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
            {p.currentStock} left
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Product List Row ─────────────────────────────────────────────────────────

function ProductListRow({
  product: p, isLast,
}: {
  product: BuyerProduct; isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.NORMAL;
  const Icon = cfg.icon;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 100px 110px",
        borderBottom: isLast ? "none" : "1px solid #f8fafc",
        background: hovered ? "#fafafa" : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Product */}
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "#f8fafc", border: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0, overflow: "hidden",
        }}>
          {p.imageUrl
            ? <img src={p.imageUrl} alt={p.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : CAT_EMOJI[p.category] ?? "🛒"}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
          {p.isDiscounted && p.discountPercent && (
            <span style={{
              fontSize: 10.5, fontWeight: 700,
              background: "#fef3c7", color: "#b45309",
              padding: "1px 6px", borderRadius: 99,
            }}>
              -{p.discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Category */}
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center" }}>
        <span style={{
          fontSize: 12.5, color: "#475569",
          background: "#f1f5f9", padding: "3px 8px",
          borderRadius: 6, fontWeight: 500,
        }}>
          {CAT_EMOJI[p.category] ?? "📦"} {p.category}
        </span>
      </div>

      {/* Price */}
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center" }}>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 800,
            color: p.isDiscounted ? "#15803d" : "#0f172a",
            letterSpacing: "-0.01em",
          }}>
            ₱{parseFloat(p.price).toFixed(2)}
          </div>
          {p.isDiscounted && p.originalPrice && (
            <div style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>
              ₱{parseFloat(p.originalPrice).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Stock */}
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center" }}>
        <span style={{
          fontSize: 13.5, fontWeight: 700,
          color: p.currentStock <= 10 ? "#c2410c" : "#0f172a",
        }}>
          {p.currentStock}
          <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8", marginLeft: 3 }}>
            units
          </span>
        </span>
      </div>

      {/* Status */}
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11.5, fontWeight: 700,
          background: cfg.bg, color: cfg.color,
          padding: "4px 9px", borderRadius: 99,
          border: `1px solid ${cfg.border}`,
          whiteSpace: "nowrap",
        }}>
          <Icon size={11} strokeWidth={2.5} />
          {p.currentStock < 1 ? "Out of Stock" : cfg.label}
        </span>
      </div>
    </div>
  );
}

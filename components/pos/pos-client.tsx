"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  Search, ShoppingCart, Plus, Minus, Trash2,
  Printer, Loader2, CheckCircle2, X, Barcode,
  ShoppingBag, AlertTriangle,
} from "lucide-react";
import { processSale } from "@/lib/actions/pos";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type POSProduct = {
  id:           string;
  name:         string;
  category:     string;
  price:        string;        // serialised Decimal
  currentStock: number;
  status:       string;
};

type CartItem = {
  product:  POSProduct;
  quantity: number;
};

type Receipt = {
  id:            string;
  receiptNumber: string;
  total:         number;
  amountPaid:    number;
  change:        number;
  createdAt:     string;
  items:         { name: string; quantity: number; unitPrice: number }[];
};

// ─── Category emoji map ────────────────────────────────────────────────────────

const CAT_EMOJI: Record<string, string> = {
  "Dairy":        "🥛",
  "Bakery":       "🍞",
  "Poultry":      "🥚",
  "Grains":       "🌾",
  "Condiments":   "🫙",
  "Beverages":    "🧃",
  "Canned Goods": "🥫",
  "Personal Care":"🧴",
  "Frozen":       "🧊",
};
const catEmoji = (cat: string) => CAT_EMOJI[cat] ?? "🛒";

// ─── Main Component ────────────────────────────────────────────────────────────

export function POSClient({
  products: initProducts,
  userId,
}: {
  products: POSProduct[];
  userId:   string;
}) {
  const [products, setProducts] = useState(initProducts);
  const [search,   setSearch]   = useState("");
  const [cart,     setCart]     = useState<CartItem[]>([]);
  const [paid,     setPaid]     = useState("");
  const [error,    setError]    = useState("");
  const [receipt,  setReceipt]  = useState<Receipt | null>(null);
  const [isPending, start]      = useTransition();

  const searchRef  = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => { searchRef.current?.focus(); }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal    = cart.reduce((s, i) => s + parseFloat(i.product.price) * i.quantity, 0);
  const paidAmount  = parseFloat(paid) || 0;
  const change      = paidAmount - subtotal;
  const canCheckout = cart.length > 0 && paidAmount >= subtotal;

  // ── Cart operations ───────────────────────────────────────────────────────
  function addToCart(product: POSProduct) {
    setError("");
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          setError(`"${product.name}" has only ${product.currentStock} unit${product.currentStock !== 1 ? "s" : ""} in stock.`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (product.currentStock < 1) {
        setError(`"${product.name}" is out of stock.`);
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function setQty(productId: string, qty: number) {
    if (qty < 1) {
      removeItem(productId);
      return;
    }
    const product = cart.find((i) => i.product.id === productId)?.product;
    if (product && qty > product.currentStock) {
      setError(`Only ${product.currentStock} unit${product.currentStock !== 1 ? "s" : ""} available.`);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    setError("");
  }

  function clearCart() {
    setCart([]);
    setPaid("");
    setError("");
  }

  // ── Checkout ──────────────────────────────────────────────────────────────
  function handleCheckout() {
    setError("");
    if (!cart.length)           { setError("Cart is empty."); return; }
    if (paidAmount < subtotal)  { setError("Payment must be ≥ total amount."); return; }

    start(async () => {
      try {
        const result = await processSale({
          items: cart.map((i) => ({
            productId: i.product.id,
            quantity:  i.quantity,
            unitPrice: parseFloat(i.product.price),
          })),
          totalAmount: subtotal,
          amountPaid:  paidAmount,
          change:      change,
          userId,
        });

        // Deduct from local product list for immediate UI feedback
        setProducts((prev) =>
          prev.map((p) => {
            const item = cart.find((ci) => ci.product.id === p.id);
            if (!item) return p;
            return { ...p, currentStock: p.currentStock - item.quantity };
          })
        );

        setReceipt(result);
        setCart([]);
        setPaid("");
      } catch (err: any) {
        setError(err.message ?? "Checkout failed. Please try again.");
      }
    });
  }

  // ── Print and close receipt ───────────────────────────────────────────────
  function handlePrint() { window.print(); }
  function closeReceipt() { setReceipt(null); setError(""); }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 0,
        height: "calc(100vh - 56px)",    // full height minus topbar
        overflow: "hidden",
      }}
    >
      {/* ════════════════════════════════════════════════
          LEFT — Product browser
      ════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #e2e8f0",
          background: "#f8fafc",
          overflow: "hidden",
        }}
      >
        {/* Search bar row */}
        <div
          style={{
            padding: "14px 16px",
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            gap: 10,
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={15}
              style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8", pointerEvents: "none",
              }}
            />
            <input
              ref={searchRef}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13.5,
                fontFamily: "DM Sans, sans-serif",
                color: "#0f172a",
                background: "#fff",
                outline: "none",
                transition: "border-color 0.14s, box-shadow 0.14s",
                boxSizing: "border-box",
              }}
              placeholder="Q Search p..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#16a34a";
                e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(22,163,74,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow   = "none";
              }}
            />
          </div>

          {/* Scan barcode */}
          <button
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#fff",
              color: "#374151",
              fontSize: 13.5, fontWeight: 500,
              fontFamily: "DM Sans, sans-serif",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background    = "#f8fafc";
              (e.currentTarget as HTMLButtonElement).style.borderColor   = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background    = "#fff";
              (e.currentTarget as HTMLButtonElement).style.borderColor   = "#e2e8f0";
            }}
          >
            <Barcode size={15} />
            ⌁ Scan barcode...
          </button>
        </div>

        {/* Product grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            alignContent: "start",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                padding: "48px 24px",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              <ShoppingBag size={40} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.35 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {search ? `No products match "${search}"` : "No products available."}
              </div>
            </div>
          ) : (
            filtered.map((product) => {
              const inCart      = cart.find((i) => i.product.id === product.id)?.quantity ?? 0;
              const outOfStock  = product.currentStock < 1;
              const atMax       = inCart >= product.currentStock;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  inCart={inCart}
                  outOfStock={outOfStock}
                  atMax={atMax}
                  onClick={() => addToCart(product)}
                />
              );
            })
          )}
        </div>

        {/* Product count footer */}
        <div
          style={{
            padding: "8px 16px",
            background: "#fff",
            borderTop: "1px solid #e2e8f0",
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          Showing {filtered.length} of {products.length} products
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT — Cart panel
      ════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Cart header */}
        <div
          style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <ShoppingCart size={17} color="#0f172a" strokeWidth={2} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
              Cart
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Item count badge */}
            <span
              style={{
                background: "#0f172a",
                color: "#fff",
                fontSize: 11.5, fontWeight: 800,
                padding: "2px 9px", borderRadius: 99,
              }}
            >
              {cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
            </span>

            {/* Clear cart */}
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  fontSize: 11.5, color: "#94a3b8", fontWeight: 500,
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                  padding: "2px 4px",
                  transition: "color 0.12s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#dc2626")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {cart.length === 0 ? (
            <div
              style={{
                padding: "36px 16px",
                textAlign: "center",
                color: "#94a3b8",
              }}
            >
              <ShoppingCart size={36} strokeWidth={1.5} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Cart is empty</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>
                Click a product to add it
              </div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <CartRow
                key={item.product.id}
                item={item}
                isLast={idx === cart.length - 1}
                onQty={(delta) => setQty(item.product.id, item.quantity + delta)}
                onRemove={() => removeItem(item.product.id)}
              />
            ))
          )}
        </div>

        {/* ── Payment section ── */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            padding: "14px 16px",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          {/* Subtotal */}
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: "1px dashed #e2e8f0",
            }}
          >
            <span style={{ fontSize: 13.5, color: "#475569", fontWeight: 500 }}>Subtotal</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              ₱{subtotal.toFixed(2)}
            </span>
          </div>

          {/* Payment Amount */}
          <div style={{ marginBottom: 10 }}>
            <label
              style={{
                display: "block",
                fontSize: 12.5, fontWeight: 600, color: "#374151",
                marginBottom: 5,
              }}
            >
              Payment Amount (₱)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={paid}
              onChange={(e) => { setPaid(e.target.value); setError(""); }}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14, fontWeight: 700,
                fontFamily: "DM Sans, sans-serif",
                color: "#0f172a",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.14s, box-shadow 0.14s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#16a34a";
                e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(22,163,74,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow   = "none";
              }}
            />
          </div>

          {/* Change */}
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: 8,
              background: change >= 0 && paid ? "#f0fdf4" : "#f8fafc",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Change
            </span>
            <span
              style={{
                fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em",
                color: change >= 0 && paid ? "#15803d" : "#94a3b8",
              }}
            >
              ₱{change >= 0 && paid ? change.toFixed(2) : "0.00"}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: 7,
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#dc2626", padding: "9px 12px",
                borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                marginBottom: 10,
              }}
            >
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {/* Print Receipt / Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={isPending || !cart.length}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%",
              padding: "12px 0",
              borderRadius: 8,
              border: "none",
              background: isPending || !cart.length ? "#e2e8f0"
                : canCheckout ? "#16a34a" : "#94a3b8",
              color: isPending || !cart.length ? "#94a3b8" : "#fff",
              fontSize: 14, fontWeight: 700,
              fontFamily: "DM Sans, sans-serif",
              cursor: isPending || !cart.length ? "not-allowed" : "pointer",
              transition: "background 0.14s",
              boxShadow: canCheckout && cart.length ? "0 2px 10px rgba(22,163,74,0.28)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isPending && cart.length && canCheckout)
                (e.currentTarget as HTMLButtonElement).style.background = "#15803d";
            }}
            onMouseLeave={(e) => {
              if (!isPending && cart.length)
                (e.currentTarget as HTMLButtonElement).style.background =
                  canCheckout ? "#16a34a" : "#94a3b8";
            }}
          >
            {isPending ? (
              <>
                <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />
                Processing…
              </>
            ) : (
              <>
                <Printer size={15} strokeWidth={2.5} />
                Print Receipt
              </>
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RECEIPT MODAL
      ════════════════════════════════════════════ */}
      {receipt && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              width: "100%", maxWidth: 360,
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              overflow: "hidden",
              animation: "receipt-in 0.25s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {/* Green top bar */}
            <div style={{ background: "#16a34a", height: 6 }} />

            {/* Header */}
            <div
              style={{
                padding: "20px 22px 14px",
                borderBottom: "1px solid #f1f5f9",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🧾</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Vine's Store
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Inventory Management System
              </div>
              <div
                style={{
                  fontSize: 11.5, color: "#64748b",
                  fontFamily: "DM Mono, monospace",
                  marginTop: 10,
                  background: "#f8fafc",
                  padding: "4px 10px",
                  borderRadius: 6,
                  display: "inline-block",
                }}
              >
                {new Date(receipt.createdAt).toLocaleString("en-PH", {
                  year: "numeric", month: "short", day: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: "14px 22px" }}>
              {receipt.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: i < receipt.items.length - 1 ? "1px solid #f8fafc" : "none",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 6 }}>
                      × {item.quantity}
                    </span>
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                    ₱{(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              style={{
                padding: "12px 22px 16px",
                background: "#f8fafc",
                borderTop: "2px dashed #e2e8f0",
              }}
            >
              {[
                { label: "Subtotal",     value: `₱${receipt.total.toFixed(2)}`,     bold: false },
                { label: "Amount Paid",  value: `₱${receipt.amountPaid.toFixed(2)}`,bold: false },
                { label: "Change",       value: `₱${receipt.change.toFixed(2)}`,     bold: true,  green: true },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#475569" }}>{row.label}</span>
                  <span
                    style={{
                      fontSize: row.bold ? 16 : 13,
                      fontWeight: row.bold ? 800 : 600,
                      color: (row as any).green ? "#15803d" : "#0f172a",
                      letterSpacing: row.bold ? "-0.02em" : 0,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer thank-you */}
            <div
              style={{
                padding: "10px 22px 4px",
                textAlign: "center",
                fontSize: 12,
                color: "#94a3b8",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              Thank you for shopping at Vine's Store!
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex", gap: 10,
                padding: "12px 22px 18px",
              }}
            >
              <button
                onClick={closeReceipt}
                style={{
                  flex: 1, padding: "9px 0",
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  background: "#fff", color: "#374151",
                  fontSize: 13.5, fontWeight: 600,
                  fontFamily: "DM Sans, sans-serif", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <X size={14} /> Close
              </button>
              <button
                onClick={handlePrint}
                style={{
                  flex: 1, padding: "9px 0",
                  border: "none", borderRadius: 8,
                  background: "#16a34a", color: "#fff",
                  fontSize: 13.5, fontWeight: 700,
                  fontFamily: "DM Sans, sans-serif", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 2px 8px rgba(22,163,74,0.28)",
                }}
              >
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin       { from { transform: rotate(0deg); }  to { transform: rotate(360deg); } }
        @keyframes receipt-in { from { opacity: 0; transform: scale(0.94) translateY(12px); }
                                to   { opacity: 1; transform: scale(1)    translateY(0);    } }
        @media print {
          body > *:not(.pos-receipt) { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product, inCart, outOfStock, atMax, onClick,
}: {
  product:    POSProduct;
  inCart:     number;
  outOfStock: boolean;
  atMax:      boolean;
  onClick:    () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const disabled = outOfStock || atMax;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? "#f8fafc" : hovered ? "#fff" : "#fff",
        border: `1px solid ${inCart > 0 ? "#16a34a" : hovered && !disabled ? "#cbd5e1" : "#e2e8f0"}`,
        borderRadius: 10,
        padding: "14px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.14s ease",
        position: "relative",
        opacity: disabled ? 0.55 : 1,
        boxShadow: hovered && !disabled ? "0 2px 8px rgba(0,0,0,0.07)" : "none",
        transform: hovered && !disabled ? "translateY(-1px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* In-cart quantity badge */}
      {inCart > 0 && (
        <div
          style={{
            position: "absolute", top: 7, right: 7,
            width: 20, height: 20, borderRadius: "50%",
            background: "#16a34a", color: "#fff",
            fontSize: 10.5, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {inCart}
        </div>
      )}

      {/* Out-of-stock chip */}
      {outOfStock && (
        <div
          style={{
            position: "absolute", top: 7, right: 7,
            background: "#fee2e2", color: "#dc2626",
            fontSize: 9.5, fontWeight: 700,
            padding: "2px 6px", borderRadius: 99,
          }}
        >
          OUT
        </div>
      )}

      {/* Emoji */}
      <div style={{ fontSize: 26, marginBottom: 8, lineHeight: 1 }}>
        {catEmoji(product.category)}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 12.5, fontWeight: 700, color: "#0f172a",
          marginBottom: 2, lineHeight: 1.35,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}
      >
        {product.name}
      </div>

      {/* Category */}
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
        {product.category}
      </div>

      {/* Price */}
      <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", letterSpacing: "-0.02em" }}>
        ₱{parseFloat(product.price).toFixed(2)}
      </div>

      {/* Stock */}
      <div
        style={{
          fontSize: 11, marginTop: 2,
          color: product.currentStock <= 10 ? "#c2410c" : "#94a3b8",
          fontWeight: product.currentStock <= 10 ? 600 : 400,
        }}
      >
        Stock: {product.currentStock}
      </div>
    </div>
  );
}

// ─── Cart Row ──────────────────────────────────────────────────────────────────

function CartRow({
  item, isLast, onQty, onRemove,
}: {
  item:     CartItem;
  isLast:   boolean;
  onQty:    (delta: number) => void;
  onRemove: () => void;
}) {
  const subtotal = parseFloat(item.product.price) * item.quantity;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 16px",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
      }}
    >
      {/* Product info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13, fontWeight: 700, color: "#0f172a",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {item.product.name}
        </div>
        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>
          ₱{parseFloat(item.product.price).toFixed(2)} each
        </div>
      </div>

      {/* Qty controls */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 0,
          border: "1px solid #e2e8f0", borderRadius: 7, overflow: "hidden",
        }}
      >
        <button
          onClick={() => onQty(-1)}
          style={{
            width: 26, height: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", cursor: "pointer",
            color: "#475569", transition: "background 0.1s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f8fafc")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
        >
          <Minus size={11} strokeWidth={2.5} />
        </button>

        <span
          style={{
            minWidth: 24, textAlign: "center",
            fontSize: 13, fontWeight: 800, color: "#0f172a",
            lineHeight: "26px",
          }}
        >
          {item.quantity}
        </span>

        <button
          onClick={() => onQty(+1)}
          style={{
            width: 26, height: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: "none", cursor: "pointer",
            color: "#475569", transition: "background 0.1s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f8fafc")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
        >
          <Plus size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* Subtotal */}
      <span
        style={{
          fontSize: 13.5, fontWeight: 800, color: "#0f172a",
          minWidth: 58, textAlign: "right", letterSpacing: "-0.01em",
        }}
      >
        ₱{subtotal.toFixed(2)}
      </span>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          width: 24, height: 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer",
          color: "#cbd5e1", borderRadius: 5, transition: "all 0.1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
          (e.currentTarget as HTMLButtonElement).style.color      = "#dc2626";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
          (e.currentTarget as HTMLButtonElement).style.color      = "#cbd5e1";
        }}
      >
        <Trash2 size={13} strokeWidth={2} />
      </button>
    </div>
  );
}

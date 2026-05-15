"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, Loader2,
  CheckCircle2, AlertTriangle, Package,
  Clock, Search, ChevronDown, Calendar, User,
} from "lucide-react";
import { recordStockMovement } from "../../lib/actions/stock";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StaffStockProduct = {
  id:                string;
  name:              string;
  category:          string;
  currentStock:      number;
  lowStockThreshold: number;
  status:            string;
};

export type StaffStockMovement = {
  id:          string;
  type:        string;
  productName: string;
  quantity:    number;
  reason:      string;
  userName:    string;
  createdAt:   string;
};

// ─── Reason options ───────────────────────────────────────────────────────────

const REASONS_IN  = [
  "Delivery from supplier",
  "Restocking",
  "Return from customer",
  "Adjustment – count increase",
  "Transfer from other branch",
];

const REASONS_OUT = [
  "Sold",
  "Expired – Disposed",
  "Damaged goods",
  "Transferred to other branch",
  "Adjustment – count decrease",
  "Stolen / Missing",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff/3600)}h ago`;
  if (diff < 172800) return "yesterday";

  return d.toLocaleDateString("en-PH", { month:"short", day:"numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StaffStockClient({
  products:    initProducts,
  movements:   initMovements,
  userId,
  staffName,
}: {
  products:  StaffStockProduct[];
  movements: StaffStockMovement[];
  userId:    string;
  staffName: string;
}) {
  const [products,  setProducts]  = useState(initProducts);
  const [movements, setMovements] = useState(initMovements);

  // ── Form state ────────────────────────────────────────────────────────────
  const [tab,        setTab]       = useState<"IN"|"OUT">("IN");
  const [productId,  setProductId] = useState("");
  const [quantity,   setQuantity]  = useState("");
  const [reason,     setReason]    = useState("");
  const [productSearch, setPSearch]= useState("");
  const [showDrop,   setShowDrop]  = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [error,      setError]     = useState("");
  const [success,    setSuccess]   = useState("");
  const [isPending,  start]        = useTransition();

  const dropRef    = useRef<HTMLDivElement>(null);
  const qtyRef     = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selected   = products.find(p => p.id === productId) ?? null;
  const reasons    = tab === "IN" ? REASONS_IN : REASONS_OUT;
  const isLow      = selected && selected.currentStock <= selected.lowStockThreshold;
  const afterStock = selected && quantity
    ? tab === "IN"
      ? selected.currentStock + (parseInt(quantity)||0)
      : selected.currentStock - (parseInt(quantity)||0)
    : null;

  // Filtered product dropdown list
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ── Switch tab ────────────────────────────────────────────────────────────
  function switchTab(t: "IN"|"OUT") {
    setTab(t);
    setReason("");
    setError("");
  }

  // ── Select product ────────────────────────────────────────────────────────
  function selectProduct(p: StaffStockProduct) {
    setProductId(p.id);
    setPSearch(p.name);
    setShowDrop(false);
    setError("");
    setTimeout(() => qtyRef.current?.focus(), 50);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");

    const qty = parseInt(quantity);
    if (!productId)     { setError("Please select a product."); return; }
    if (!qty || qty < 1){ setError("Enter a valid quantity (minimum 1)."); return; }
    if (tab === "OUT" && selected && qty > selected.currentStock) {
      setError(`Only ${selected.currentStock} unit${selected.currentStock!==1?"s":""} available in stock.`);
      return;
    }

    start(async () => {
      try {
        const result = await recordStockMovement({
          type:      tab,
          productId,
          quantity:  qty,
          reason:    reason || null,
          userId,
        });

        // Update local product stock
        setProducts(prev => prev.map(p =>
          p.id === productId
            ? { ...p, currentStock: result.newStock, status: result.newStatus }
            : p
        ));

        // Prepend new movement
        setMovements(prev => [{
          id:          result.movement.id,
          type:        result.movement.type,
          productName: result.movement.product.name,
          quantity:    result.movement.quantity,
          reason:      result.movement.reason ?? "",
          userName:    result.movement.user.name,
          createdAt:   result.movement.createdAt,
        }, ...prev].slice(0, 15));

        // Reset form
        setProductId("");
        setPSearch("");
        setQuantity("");
        setReason("");

        const name = result.movement.product.name;
        setSuccess(
          tab === "IN"
            ? `✓ Added ${qty} unit${qty!==1?"s":""} of ${name}. New stock: ${result.newStock}`
            : `✓ Removed ${qty} unit${qty!==1?"s":""} from ${name}. New stock: ${result.newStock}`
        );
        setTimeout(() => setSuccess(""), 5000);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong. Please try again.");
      }
    });
  }

  // ── Colors per tab ────────────────────────────────────────────────────────
  const C = tab === "IN"
    ? { main:"#16a34a", light:"#dcfce7", border:"#16a34a", dark:"#15803d", faint:"#f0fdf4" }
    : { main:"#dc2626", light:"#fee2e2", border:"#dc2626", dark:"#b91c1c", faint:"#fef2f2" };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:"24px 28px", maxWidth:1100, margin:"0 auto" }}>

      {/* ── Success toast ── */}
      {success && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:100,
          background:"#15803d", color:"#fff",
          padding:"14px 20px", borderRadius:12,
          fontSize:14, fontWeight:600,
          boxShadow:"0 8px 28px rgba(21,128,61,0.35)",
          display:"flex", alignItems:"center", gap:10,
          animation:"toast-in 0.25s ease both",
          maxWidth:400,
        }}>
          <CheckCircle2 size={18}/>{success}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{
          fontSize:22, fontWeight:800, color:"#0f172a",
          letterSpacing:"-0.03em", margin:"0 0 4px",
        }}>
          Stock Monitoring
        </h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>
          Hi {staffName} — record stock movements quickly below
        </p>
      </div>

      {/* ── Two column layout ── */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"420px 1fr",
        gap:20,
        alignItems:"start",
      }}>

        {/* ════════════════════════════
            LEFT — Record Form
        ════════════════════════════ */}
        <div style={{
          background:"#fff",
          border:"1px solid #e2e8f0",
          borderRadius:16,
          overflow:"hidden",
          boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
        }}>

          {/* Tab buttons */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr",
          }}>
            {(["IN","OUT"] as const).map(t => {
              const col = t==="IN"
                ? { active:"#16a34a", light:"#f0fdf4", text:"#15803d" }
                : { active:"#dc2626", light:"#fef2f2", text:"#b91c1c" };
              const active = tab === t;
              return (
                <button key={t} type="button" onClick={() => switchTab(t)}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                    padding:"18px 0",
                    border:"none",
                    borderBottom: active ? `3px solid ${col.active}` : "3px solid #e2e8f0",
                    background:   active ? col.light : "#f8fafc",
                    color:        active ? col.text  : "#94a3b8",
                    fontSize:15,  fontWeight:active?800:500,
                    fontFamily:"DM Sans, sans-serif",
                    cursor:"pointer", transition:"all 0.14s",
                  }}>
                  {t==="IN"
                    ? <ArrowDownToLine size={18} strokeWidth={2.5}/>
                    : <ArrowUpFromLine size={18} strokeWidth={2.5}/>}
                  Stock {t==="IN"?"In":"Out"}
                </button>
              );
            })}
          </div>

          {/* Form body */}
          <div style={{ padding:"24px 24px 20px" }}>
            <form onSubmit={handleSubmit}
              style={{ display:"flex", flexDirection:"column", gap:18 }}>

              {/* ── Product searchable dropdown ── */}
              <div>
                <label style={{
                  display:"block", fontSize:13, fontWeight:700,
                  color:"#374151", marginBottom:8, letterSpacing:"0.01em",
                }}>
                  Product <span style={{color:"#dc2626"}}>*</span>
                </label>

                <div ref={dropRef} style={{ position:"relative" }}>
                  {/* Search input */}
                  <div style={{ position:"relative" }}>
                    <Search size={16} style={{
                      position:"absolute", left:12, top:"50%",
                      transform:"translateY(-50%)",
                      color:"#94a3b8", pointerEvents:"none",
                    }}/>
                    <input
                      type="text"
                      placeholder="Search and select a product…"
                      value={productSearch}
                      onChange={e => {
                        setPSearch(e.target.value);
                        setProductId("");
                        setShowDrop(true);
                        setError("");
                      }}
                      onFocus={() => setShowDrop(true)}
                      style={{
                        width:"100%", padding:"12px 12px 12px 38px",
                        border:`2px solid ${productId ? C.border : "#e2e8f0"}`,
                        borderRadius:10, fontSize:14,
                        fontFamily:"DM Sans, sans-serif",
                        color:"#0f172a", background:"#fff",
                        outline:"none", boxSizing:"border-box",
                        transition:"border-color 0.14s",
                      }}
                      onBlur={e => {
                        if (!e.currentTarget.style) return;
                        e.currentTarget.style.borderColor = productId ? C.border : "#e2e8f0";
                      }}
                    />
                    <ChevronDown size={14} color="#94a3b8" style={{
                      position:"absolute", right:12, top:"50%",
                      transform:`translateY(-50%) rotate(${showDrop?"180deg":"0"})`,
                      transition:"transform 0.15s", pointerEvents:"none",
                    }}/>
                  </div>

                  {/* Dropdown list */}
                  {showDrop && (
                    <div style={{
                      position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
                      background:"#fff", border:"1px solid #e2e8f0",
                      borderRadius:10, zIndex:20,
                      boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
                      maxHeight:240, overflowY:"auto",
                    }}>
                      {filteredProducts.length === 0 ? (
                        <div style={{ padding:"16px", textAlign:"center",
                          color:"#94a3b8", fontSize:13.5 }}>
                          No products found
                        </div>
                      ) : filteredProducts.map(p => {
                        const low = p.currentStock <= p.lowStockThreshold;
                        return (
                          <div key={p.id}
                            onMouseDown={() => selectProduct(p)}
                            style={{
                              display:"flex", alignItems:"center",
                              justifyContent:"space-between",
                              padding:"11px 14px",
                              borderBottom:"1px solid #f8fafc",
                              cursor:"pointer",
                              background: productId===p.id ? "#f0fdf4" : "transparent",
                              transition:"background 0.1s",
                            }}
                            onMouseEnter={e => {
                              if (productId!==p.id)
                                (e.currentTarget as HTMLDivElement).style.background="#f8fafc";
                            }}
                            onMouseLeave={e => {
                              if (productId!==p.id)
                                (e.currentTarget as HTMLDivElement).style.background="transparent";
                            }}
                          >
                            <div>
                              <div style={{ fontSize:13.5, fontWeight:600, color:"#0f172a" }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize:12, color:"#94a3b8", marginTop:1 }}>
                                {p.category}
                              </div>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0 }}>
                              <div style={{
                                fontSize:14, fontWeight:800,
                                color: p.currentStock<1 ? "#b91c1c" : low ? "#c2410c" : "#15803d",
                              }}>
                                {p.currentStock}
                              </div>
                              <div style={{ fontSize:10.5, color:"#94a3b8" }}>in stock</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected product stock preview */}
                {selected && (
                  <div style={{
                    marginTop:10,
                    padding:"12px 14px",
                    borderRadius:10,
                    background: isLow ? "#fff7ed" : "#f0fdf4",
                    border:`1px solid ${isLow ? "#fed7aa" : "#bbf7d0"}`,
                    display:"flex", alignItems:"center",
                    justifyContent:"space-between",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Package size={16} color={isLow?"#c2410c":"#15803d"}/>
                      <span style={{ fontSize:13.5, fontWeight:600,
                        color: isLow?"#c2410c":"#15803d" }}>
                        Current stock: {selected.currentStock} units
                      </span>
                    </div>
                    {isLow && (
                      <span style={{
                        fontSize:11.5, fontWeight:700,
                        background:"#ffedd5", color:"#c2410c",
                        padding:"2px 8px", borderRadius:99,
                        border:"1px solid #fed7aa",
                      }}>
                        ⚠ Low Stock
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Quantity ── */}
              <div>
                <label style={{
                  display:"block", fontSize:13, fontWeight:700,
                  color:"#374151", marginBottom:8,
                }}>
                  Quantity <span style={{color:"#dc2626"}}>*</span>
                </label>
                <input
                  ref={qtyRef}
                  type="number" min="1"
                  placeholder="0"
                  value={quantity}
                  onChange={e => { setQuantity(e.target.value); setError(""); }}
                  style={{
                    width:"100%", padding:"14px 16px",
                    border:`2px solid ${quantity ? C.border : "#e2e8f0"}`,
                    borderRadius:10, fontSize:22, fontWeight:800,
                    fontFamily:"DM Sans, sans-serif",
                    color:"#0f172a", textAlign:"center",
                    background:"#fff", outline:"none",
                    boxSizing:"border-box",
                    transition:"border-color 0.14s",
                    letterSpacing:"-0.02em",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = C.main;
                    e.currentTarget.style.boxShadow   = `0 0 0 3px ${C.light}`;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = quantity ? C.border : "#e2e8f0";
                    e.currentTarget.style.boxShadow   = "none";
                  }}
                />

                {/* After-movement preview */}
                {afterStock !== null && quantity && parseInt(quantity) > 0 && (
                  <div style={{
                    marginTop:8, padding:"9px 14px",
                    background:"#f8fafc", border:"1px solid #e2e8f0",
                    borderRadius:8, fontSize:13, color:"#475569",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                  }}>
                    <span>After this movement:</span>
                    <strong style={{
                      color: afterStock<0 ? "#dc2626"
                           : afterStock<=selected!.lowStockThreshold ? "#c2410c"
                           : "#15803d",
                      fontSize:14,
                    }}>
                      {Math.max(0, afterStock)} units
                      {afterStock < 0 && " ⚠ Exceeds available stock"}
                    </strong>
                  </div>
                )}
              </div>

              {/* ── Reason ── */}
              <div>
                <label style={{
                  display:"block", fontSize:13, fontWeight:700,
                  color:"#374151", marginBottom:8,
                }}>
                  Reason
                </label>
                <div style={{ position:"relative" }}>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    style={{
                      width:"100%", padding:"12px 36px 12px 14px",
                      border:"2px solid #e2e8f0", borderRadius:10,
                      fontSize:14, fontFamily:"DM Sans, sans-serif",
                      color: reason ? "#0f172a" : "#94a3b8",
                      background:"#fff", outline:"none",
                      appearance:"none", cursor:"pointer",
                      boxSizing:"border-box",
                      transition:"border-color 0.14s",
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = C.main;
                      e.currentTarget.style.boxShadow   = `0 0 0 3px ${C.light}`;
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = reason ? C.border : "#e2e8f0";
                      e.currentTarget.style.boxShadow   = "none";
                    }}
                  >
                    <option value="">Select a reason…</option>
                    {reasons.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} color="#94a3b8" style={{
                    position:"absolute", right:12, top:"50%",
                    transform:"translateY(-50%)", pointerEvents:"none",
                  }}/>
                </div>
              </div>

              {/* ── Error ── */}
              {error && (
                <div style={{
                  display:"flex", alignItems:"flex-start", gap:9,
                  background:"#fef2f2", border:"1px solid #fecaca",
                  color:"#dc2626", padding:"12px 14px",
                  borderRadius:10, fontSize:13.5, fontWeight:500,
                }}>
                  <AlertTriangle size={16} style={{flexShrink:0, marginTop:1}}/>
                  {error}
                </div>
              )}

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={isPending || !productId}
                style={{
                  display:"flex", alignItems:"center",
                  justifyContent:"center", gap:9,
                  width:"100%", padding:"16px 0",
                  borderRadius:12, border:"none",
                  background: isPending||!productId ? "#e2e8f0" : C.main,
                  color:      isPending||!productId ? "#94a3b8" : "#fff",
                  fontSize:16, fontWeight:800,
                  fontFamily:"DM Sans, sans-serif",
                  cursor: isPending||!productId ? "not-allowed" : "pointer",
                  transition:"all 0.14s",
                  boxShadow: !isPending&&productId
                    ? `0 4px 14px ${C.main}44` : "none",
                  letterSpacing:"-0.01em",
                }}
                onMouseEnter={e => {
                  if (!isPending && productId)
                    (e.currentTarget as HTMLButtonElement).style.background = C.dark;
                }}
                onMouseLeave={e => {
                  if (!isPending && productId)
                    (e.currentTarget as HTMLButtonElement).style.background = C.main;
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} style={{animation:"spin 0.7s linear infinite"}}/>
                    Saving…
                  </>
                ) : (
                  <>
                    {tab==="IN"
                      ? <ArrowDownToLine size={18} strokeWidth={2.5}/>
                      : <ArrowUpFromLine size={18} strokeWidth={2.5}/>}
                    Save Stock {tab==="IN"?"In":"Out"}
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* ════════════════════════════
            RIGHT — Recent Movements
        ════════════════════════════ */}
        <div style={{
          background:"#fff",
          border:"1px solid #e2e8f0",
          borderRadius:16,
          overflow:"hidden",
          boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
        }}>
          {/* Header */}
          <div style={{
            padding:"18px 22px 16px",
            borderBottom:"1px solid #f1f5f9",
            display:"flex", alignItems:"center",
            justifyContent:"space-between",
          }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0f172a",
                letterSpacing:"-0.01em" }}>
                Recent Movements
              </div>
              <div style={{ fontSize:12.5, color:"#94a3b8", marginTop:2 }}>
                Last {movements.length} records
              </div>
            </div>
            <div style={{
              background:"#f8fafc", border:"1px solid #e2e8f0",
              borderRadius:8, padding:"5px 12px",
              fontSize:12, color:"#64748b", fontWeight:500,
            }}>
              Today's count: {movements.filter(m => {
                const d = new Date(m.createdAt);
                const n = new Date();
                return d.toDateString() === n.toDateString();
              }).length}
            </div>
          </div>

          {/* Movement list */}
          {movements.length === 0 ? (
            <div style={{
              padding:"64px 24px", textAlign:"center", color:"#94a3b8",
            }}>
              <div style={{ fontSize:44, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:15, fontWeight:600, color:"#374151", marginBottom:4 }}>
                No movements yet
              </div>
              <div style={{ fontSize:13.5 }}>
                Use the form on the left to record your first stock movement.
              </div>
            </div>
          ) : (
            <div>
              {movements.map((m, idx) => (
                <MovementItem
                  key={m.id}
                  movement={m}
                  isLast={idx === movements.length-1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes toast-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ─── Movement Item ─────────────────────────────────────────────────────────────

function MovementItem({ movement:m, isLast }:{
  movement:StaffStockMovement; isLast:boolean;
}) {
  const isIn = m.type === "IN";
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"flex", alignItems:"center", gap:14,
        padding:"14px 22px",
        borderBottom: isLast ? "none" : "1px solid #f8fafc",
        background: hov ? "#fafafa" : "transparent",
        transition:"background 0.1s",
      }}
    >
      {/* Type icon */}
      <div style={{
        width:40, height:40, borderRadius:12, flexShrink:0,
        background: isIn ? "#dcfce7" : "#fee2e2",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {isIn
          ? <ArrowDownToLine size={18} color="#15803d" strokeWidth={2.5}/>
          : <ArrowUpFromLine size={18} color="#b91c1c" strokeWidth={2.5}/>}
      </div>

      {/* Product + reason */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#0f172a",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {m.productName}
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:1 }}>
          {m.reason || (isIn ? "Stock added" : "Stock removed")}
        </div>
      </div>

      {/* Qty + meta */}
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{
          fontSize:16, fontWeight:800, letterSpacing:"-0.02em",
          color: isIn ? "#15803d" : "#b91c1c",
        }}>
          {isIn ? "+" : "−"}{m.quantity}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:3,
          justifyContent:"flex-end", marginTop:2 }}>
          <Clock size={10} color="#94a3b8"/>
          <span style={{ fontSize:11.5, color:"#94a3b8" }}>
            {formatDate(m.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
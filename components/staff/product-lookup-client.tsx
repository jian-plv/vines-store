"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Package, MapPin, Barcode,
  AlertTriangle, Clock, XCircle, CheckCircle2,
  LayoutGrid, List, X, SlidersHorizontal,
  TrendingDown, Tag,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LookupProduct = {
  id:                string;
  name:              string;
  category:          string;
  price:             string;
  currentStock:      number;
  lowStockThreshold: number;
  status:            string;
  imageUrl:          string | null;
  shelfLocation:     string | null;
  barcode:           string | null;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string; icon: React.ElementType;
  bg: string; color: string; border: string; dot: string;
}> = {
  NORMAL:      { label:"Normal",      icon:CheckCircle2,  bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0", dot:"#16a34a" },
  LOW:         { label:"Low Stock",   icon:AlertTriangle, bg:"#fff7ed", color:"#c2410c", border:"#fed7aa", dot:"#ea580c" },
  NEAR_EXPIRY: { label:"Near Expiry", icon:Clock,         bg:"#fffbeb", color:"#b45309", border:"#fde68a", dot:"#d97706" },
  EXPIRED:     { label:"Expired",     icon:XCircle,       bg:"#fef2f2", color:"#b91c1c", border:"#fecaca", dot:"#dc2626" },
};

const CAT_EMOJI: Record<string, string> = {
  "Dairy":"🥛","Bakery":"🍞","Poultry":"🥚","Grains":"🌾",
  "Condiments":"🫙","Beverages":"🧃","Canned Goods":"🥫",
  "Personal Care":"🧴","Frozen":"🧊",
};

const CAT_COLOR: Record<string, { bg: string; color: string }> = {
  "Dairy":        { bg:"#dbeafe", color:"#1d4ed8" },
  "Bakery":       { bg:"#fef3c7", color:"#b45309" },
  "Poultry":      { bg:"#ffedd5", color:"#c2410c" },
  "Grains":       { bg:"#f0fdf4", color:"#15803d" },
  "Condiments":   { bg:"#fdf4ff", color:"#7e22ce" },
  "Beverages":    { bg:"#ecfeff", color:"#0e7490" },
  "Canned Goods": { bg:"#f1f5f9", color:"#475569" },
  "Personal Care":{ bg:"#fdf2f8", color:"#9d174d" },
  "Frozen":       { bg:"#eff6ff", color:"#2563eb" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductLookupClient({ products }: { products: LookupProduct[] }) {
  const [query,     setQuery]     = useState("");
  const [search,    setSearch]    = useState("");
  const [view,      setView]      = useState<"grid"|"table">("grid");
  const [filter,    setFilter]    = useState("ALL");
  const [selected,  setSelected]  = useState<LookupProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  function handleChange(val: string) {
    setQuery(val);
    setIsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setIsLoading(false);
    }, 180);
  }

  // ── Counts ────────────────────────────────────────────────────────────────
  const counts = {
    ALL:         products.length,
    NORMAL:      products.filter(p => p.status === "NORMAL").length,
    LOW:         products.filter(p => p.status === "LOW").length,
    NEAR_EXPIRY: products.filter(p => p.status === "NEAR_EXPIRY").length,
    EXPIRED:     products.filter(p => p.status === "EXPIRED").length,
  };

  // ── Filter + search ───────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const q  = search.toLowerCase();
    const ok = !q ||
      p.name.toLowerCase().includes(q)         ||
      p.category.toLowerCase().includes(q)     ||
      (p.barcode?.toLowerCase().includes(q))   ||
      (p.shelfLocation?.toLowerCase().includes(q));
    const fs = filter === "ALL" || p.status === filter;
    return ok && fs;
  });

  // ── Filter tabs config ────────────────────────────────────────────────────
  const FILTER_TABS = [
    { key:"ALL",         label:"All Products",  count: counts.ALL,         color:"#374151", activeBg:"#0f172a",   activeTxt:"#fff"    },
    { key:"NORMAL",      label:"In Stock",      count: counts.NORMAL,      color:"#15803d", activeBg:"#16a34a",   activeTxt:"#fff"    },
    { key:"LOW",         label:"Low Stock",     count: counts.LOW,         color:"#c2410c", activeBg:"#ea580c",   activeTxt:"#fff"    },
    { key:"NEAR_EXPIRY", label:"Near Expiry",   count: counts.NEAR_EXPIRY, color:"#b45309", activeBg:"#d97706",   activeTxt:"#fff"    },
    { key:"EXPIRED",     label:"Expired",       count: counts.EXPIRED,     color:"#b91c1c", activeBg:"#dc2626",   activeTxt:"#fff"    },
  ];

  return (
    <div style={{ width:"100%" }}>

      {/* ══════════════════════════════════════════════
          HERO SEARCH BAR
      ══════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: 16,
        padding: "28px 28px 24px",
        marginBottom: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
      }}>
        {/* Title row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>
              Product Lookup
            </div>
            <div style={{ fontSize:13, color:"#94a3b8", marginTop:2 }}>
              {products.length} products · search by name, category or barcode
            </div>
          </div>
          {/* View toggle */}
          <div style={{
            display:"flex",
            background:"rgba(255,255,255,0.08)",
            borderRadius:9, padding:3, gap:2,
          }}>
            {([
              { key:"grid",  icon:LayoutGrid, label:"Grid"  },
              { key:"table", icon:List,        label:"Table" },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setView(v.key)}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"7px 14px", borderRadius:7, border:"none",
                  background: view===v.key ? "#fff" : "transparent",
                  color:      view===v.key ? "#0f172a" : "#94a3b8",
                  fontSize:13, fontWeight:600,
                  fontFamily:"DM Sans, sans-serif",
                  cursor:"pointer", transition:"all 0.13s",
                }}>
                <v.icon size={14}/>{v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Big search input */}
        <div style={{ position:"relative" }}>
          <Search size={20} style={{
            position:"absolute", left:16, top:"50%",
            transform:"translateY(-50%)",
            color: query ? "#22c55e" : "#64748b",
            transition:"color 0.15s", pointerEvents:"none",
          }}/>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by product name, category, barcode, or shelf location…"
            value={query}
            onChange={e => handleChange(e.target.value)}
            style={{
              width:"100%", padding:"15px 48px 15px 50px",
              border:"2px solid",
              borderColor: query ? "#22c55e" : "rgba(255,255,255,0.12)",
              borderRadius:12,
              fontSize:15, fontFamily:"DM Sans, sans-serif", fontWeight:500,
              color:"#fff",
              background:"rgba(255,255,255,0.07)",
              outline:"none",
              transition:"border-color 0.15s, background 0.15s",
              boxSizing:"border-box",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor  = "#22c55e";
              e.currentTarget.style.background   = "rgba(255,255,255,0.10)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor  = query ? "#22c55e" : "rgba(255,255,255,0.12)";
              e.currentTarget.style.background   = "rgba(255,255,255,0.07)";
            }}
          />
          {/* Clear */}
          {query && (
            <button onClick={() => { setQuery(""); setSearch(""); }}
              style={{
                position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                width:28, height:28, borderRadius:"50%",
                background:"rgba(255,255,255,0.15)", border:"none",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", color:"#94a3b8",
              }}>
              <X size={14} strokeWidth={2.5}/>
            </button>
          )}
        </div>

        {/* Result count bar */}
        <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10 }}>
          {isLoading ? (
            <span style={{ fontSize:13, color:"#64748b" }}>Searching…</span>
          ) : (
            <>
              <span style={{
                fontSize:13, fontWeight:600,
                color: filtered.length===0 ? "#ef4444" : "#22c55e",
              }}>
                {filtered.length} {filtered.length===1?"result":"results"}
              </span>
              {search && (
                <span style={{ fontSize:13, color:"#64748b" }}>for "{search}"</span>
              )}
              {/* Alert pills */}
              {counts.LOW > 0 && filter !== "LOW" && (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:4,
                  background:"rgba(234,88,12,0.2)", color:"#fb923c",
                  border:"1px solid rgba(234,88,12,0.3)",
                  fontSize:11.5, fontWeight:700, padding:"3px 9px", borderRadius:99,
                }}>
                  <AlertTriangle size={11}/>{counts.LOW} low stock
                </span>
              )}
              {counts.NEAR_EXPIRY > 0 && filter !== "NEAR_EXPIRY" && (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:4,
                  background:"rgba(217,119,6,0.2)", color:"#fbbf24",
                  border:"1px solid rgba(217,119,6,0.3)",
                  fontSize:11.5, fontWeight:700, padding:"3px 9px", borderRadius:99,
                }}>
                  <Clock size={11}/>{counts.NEAR_EXPIRY} near expiry
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FILTER TABS
      ══════════════════════════════════════════════ */}
      <div style={{
        display:"flex", gap:8, marginBottom:20, flexWrap:"wrap",
      }}>
        {FILTER_TABS.map(tab => {
          const active = filter === tab.key;
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"8px 16px", borderRadius:99,
                border:`1.5px solid ${active ? tab.activeBg : "#e2e8f0"}`,
                background: active ? tab.activeBg : "#fff",
                color:      active ? tab.activeTxt : tab.color,
                fontSize:13, fontWeight:active?700:500,
                fontFamily:"DM Sans, sans-serif",
                cursor:"pointer", transition:"all 0.13s",
                boxShadow: active ? `0 2px 8px ${tab.activeBg}44` : "none",
              }}>
              {tab.label}
              <span style={{
                background: active ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                color:      active ? tab.activeTxt : "#64748b",
                fontSize:11, fontWeight:800,
                padding:"1px 7px", borderRadius:99, lineHeight:"16px",
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════
          SHIMMER LOADING
      ══════════════════════════════════════════════ */}
      {isLoading && (
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))",
          gap:16,
        }}>
          {Array.from({length:8}).map((_,i) => (
            <div key={i} style={{
              background:"#fff", borderRadius:14,
              border:"1px solid #e2e8f0", height:220,
              animation:"shimmer 1.4s ease-in-out infinite",
              animationDelay:`${i*0.07}s`,
            }}/>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════════════ */}
      {!isLoading && filtered.length===0 && (
        <div style={{
          padding:"80px 24px", textAlign:"center",
          background:"#fff", border:"1px solid #e2e8f0",
          borderRadius:16, color:"#94a3b8",
        }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔍</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#374151", marginBottom:8 }}>
            No products found
          </div>
          <div style={{ fontSize:14, color:"#94a3b8", marginBottom:20, lineHeight:1.6 }}>
            {search
              ? <>No results for <strong style={{color:"#0f172a"}}>"{search}"</strong><br/>Try a different name, category, or barcode.</>
              : "No products match the selected filter."}
          </div>
          <button onClick={() => { setQuery(""); setSearch(""); setFilter("ALL"); }}
            style={{
              padding:"9px 22px", borderRadius:9,
              border:"1px solid #e2e8f0", background:"#fff",
              color:"#374151", fontSize:13.5, fontWeight:600,
              fontFamily:"DM Sans, sans-serif", cursor:"pointer",
            }}>
            Clear filters
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          GRID VIEW
      ══════════════════════════════════════════════ */}
      {!isLoading && filtered.length>0 && view==="grid" && (
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))",
          gap:16,
        }}>
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => setSelected(p)}/>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TABLE VIEW
      ══════════════════════════════════════════════ */}
      {!isLoading && filtered.length>0 && view==="table" && (
        <div style={{
          background:"#fff", border:"1px solid #e2e8f0",
          borderRadius:14, overflow:"hidden",
          boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Header */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"2.5fr 1fr 120px 100px 130px 130px",
            background:"#f8fafc",
            borderBottom:"1px solid #f1f5f9",
          }}>
            {["PRODUCT","CATEGORY","PRICE","STOCK","SHELF","STATUS"].map(h => (
              <div key={h} style={{
                padding:"11px 16px",
                fontSize:10.5, fontWeight:700,
                letterSpacing:"0.07em",
                textTransform:"uppercase" as const,
                color:"#94a3b8",
              }}>{h}</div>
            ))}
          </div>
          {filtered.map((p,i) => (
            <TableRow key={p.id} product={p} isLast={i===filtered.length-1}
              onClick={() => setSelected(p)}/>
          ))}
        </div>
      )}

      {/* Footer count */}
      {!isLoading && filtered.length>0 && (
        <div style={{
          marginTop:16, textAlign:"center",
          fontSize:12.5, color:"#94a3b8",
        }}>
          Showing <strong style={{color:"#374151"}}>{filtered.length}</strong> of{" "}
          <strong style={{color:"#374151"}}>{products.length}</strong> products
        </div>
      )}

      {/* ══════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════ */}
      {selected && (
        <ProductDetailModal product={selected} onClose={() => setSelected(null)}/>
      )}

      <style>{`
        @keyframes shimmer {
          0%,100%{opacity:1} 50%{opacity:0.35}
        }
        @keyframes modal-in {
          from{opacity:0;transform:scale(0.96) translateY(12px)}
          to{opacity:1;transform:scale(1) translateY(0)}
        }
        @media (min-width:1400px) {
          .lookup-grid { grid-template-columns: repeat(4,1fr) !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product:p, onClick }:{ product:LookupProduct; onClick:()=>void }) {
  const [hov, setHov] = useState(false);
  const cfg     = STATUS_CFG[p.status] ?? STATUS_CFG.NORMAL;
  const Icon    = cfg.icon;
  const isLow   = p.currentStock <= p.lowStockThreshold;
  const isEmpty = p.currentStock < 1;
  const catClr  = CAT_COLOR[p.category] ?? { bg:"#f1f5f9", color:"#475569" };
  const stockPct = Math.min(100, Math.round(p.currentStock / Math.max(p.lowStockThreshold * 3, 1) * 100));

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:"#fff",
        border:`1.5px solid ${hov ? "#16a34a" : "#e2e8f0"}`,
        borderRadius:14,
        overflow:"hidden",
        cursor:"pointer",
        transition:"all 0.15s ease",
        boxShadow: hov
          ? "0 8px 24px rgba(22,163,74,0.14)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-3px)" : "none",
        opacity: isEmpty ? 0.65 : 1,
      }}
    >
      {/* Image / emoji area */}
      <div style={{
        height:120, overflow:"hidden",
        background: `linear-gradient(135deg, ${catClr.bg} 0%, ${catClr.bg}88 100%)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        position:"relative",
      }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        ) : (
          <span style={{ fontSize:52, lineHeight:1 }}>
            {CAT_EMOJI[p.category] ?? "📦"}
          </span>
        )}

        {/* Status badge */}
        <div style={{
          position:"absolute", top:10, left:10,
          display:"inline-flex", alignItems:"center", gap:4,
          fontSize:11, fontWeight:700,
          background:"rgba(255,255,255,0.92)",
          color: cfg.color,
          padding:"3px 9px", borderRadius:99,
          backdropFilter:"blur(4px)",
          border:`1px solid ${cfg.border}`,
          boxShadow:"0 1px 4px rgba(0,0,0,0.08)",
        }}>
          <Icon size={10} strokeWidth={2.5}/>
          {isEmpty ? "Out of Stock" : cfg.label}
        </div>

        {/* Price badge */}
        <div style={{
          position:"absolute", top:10, right:10,
          background:"rgba(15,23,42,0.85)",
          color:"#fff", fontSize:13, fontWeight:800,
          padding:"4px 10px", borderRadius:99,
          backdropFilter:"blur(4px)",
          letterSpacing:"-0.02em",
        }}>
          ₱{parseFloat(p.price).toFixed(2)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"14px 16px 12px" }}>

        {/* Category chip */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          fontSize:11, fontWeight:700,
          background: catClr.bg, color: catClr.color,
          padding:"3px 9px", borderRadius:99,
          marginBottom:8,
        }}>
          {CAT_EMOJI[p.category] ?? "📦"} {p.category}
        </div>

        {/* Name */}
        <div style={{
          fontSize:14.5, fontWeight:800, color:"#0f172a",
          lineHeight:1.3, marginBottom:12,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const,
          letterSpacing:"-0.01em",
        }}>
          {p.name}
        </div>

        {/* Stock bar */}
        <div style={{ marginBottom:10 }}>
          <div style={{
            display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:5,
          }}>
            <span style={{ fontSize:11.5, color:"#64748b", fontWeight:500 }}>
              Stock Level
            </span>
            <span style={{
              fontSize:13, fontWeight:800,
              color: isEmpty ? "#b91c1c" : isLow ? "#c2410c" : "#15803d",
            }}>
              {p.currentStock}
              <span style={{ fontSize:11, fontWeight:400, color:"#94a3b8", marginLeft:3 }}>
                / min {p.lowStockThreshold}
              </span>
            </span>
          </div>
          <div style={{
            height:5, background:"#f1f5f9",
            borderRadius:99, overflow:"hidden",
          }}>
            <div style={{
              height:"100%", borderRadius:99,
              width:`${stockPct}%`,
              background: isEmpty ? "#dc2626" : isLow ? "#ea580c" : "#16a34a",
              transition:"width 0.3s ease",
            }}/>
          </div>
        </div>

        {/* Shelf location */}
        {p.shelfLocation && (
          <div style={{
            display:"flex", alignItems:"center", gap:5,
            fontSize:12, color:"#64748b",
            paddingTop:10,
            borderTop:"1px solid #f8fafc",
          }}>
            <MapPin size={12} color="#94a3b8" strokeWidth={2}/>
            <span style={{ fontWeight:500 }}>{p.shelfLocation}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TableRow({ product:p, isLast, onClick }:{
  product:LookupProduct; isLast:boolean; onClick:()=>void;
}) {
  const [hov, setHov] = useState(false);
  const cfg   = STATUS_CFG[p.status] ?? STATUS_CFG.NORMAL;
  const Icon  = cfg.icon;
  const isLow = p.currentStock <= p.lowStockThreshold;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:"grid",
        gridTemplateColumns:"2.5fr 1fr 120px 100px 130px 130px",
        borderBottom: isLast ? "none" : "1px solid #f8fafc",
        background: hov ? "#f0fdf4" : "transparent",
        cursor:"pointer", transition:"background 0.1s",
      }}
    >
      {/* Product */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{
          width:42, height:42, borderRadius:10, flexShrink:0,
          background:"#f8fafc", border:"1px solid #e2e8f0",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, overflow:"hidden",
        }}>
          {p.imageUrl
            ? <img src={p.imageUrl} alt={p.name}
                style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : CAT_EMOJI[p.category] ?? "📦"}
        </div>
        <div>
          <div style={{ fontSize:13.5, fontWeight:700, color:"#0f172a" }}>{p.name}</div>
          {p.barcode && (
            <div style={{
              display:"flex", alignItems:"center", gap:4,
              fontSize:11, color:"#94a3b8", marginTop:2,
            }}>
              <Barcode size={10}/>{p.barcode}
            </div>
          )}
        </div>
      </div>

      {/* Category */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center" }}>
        <span style={{
          fontSize:12.5, fontWeight:600,
          background: CAT_COLOR[p.category]?.bg ?? "#f1f5f9",
          color:      CAT_COLOR[p.category]?.color ?? "#475569",
          padding:"4px 10px", borderRadius:99,
        }}>
          {CAT_EMOJI[p.category] ?? "📦"} {p.category}
        </span>
      </div>

      {/* Price */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center" }}>
        <span style={{ fontSize:15, fontWeight:800, color:"#0f172a", letterSpacing:"-0.01em" }}>
          ₱{parseFloat(p.price).toFixed(2)}
        </span>
      </div>

      {/* Stock */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center" }}>
        <div>
          <div style={{
            fontSize:16, fontWeight:800,
            color: p.currentStock<1 ? "#b91c1c" : isLow ? "#c2410c" : "#15803d",
          }}>{p.currentStock}</div>
          <div style={{ fontSize:10.5, color:"#94a3b8" }}>min {p.lowStockThreshold}</div>
        </div>
      </div>

      {/* Shelf */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center" }}>
        {p.shelfLocation ? (
          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12.5, color:"#64748b" }}>
            <MapPin size={12} color="#94a3b8" strokeWidth={2}/>
            {p.shelfLocation}
          </div>
        ) : (
          <span style={{ color:"#e2e8f0", fontSize:16 }}>—</span>
        )}
      </div>

      {/* Status */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center" }}>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:5,
          fontSize:12, fontWeight:700,
          background:cfg.bg, color:cfg.color,
          padding:"5px 11px", borderRadius:99,
          border:`1px solid ${cfg.border}`,
          whiteSpace:"nowrap" as const,
        }}>
          <Icon size={11} strokeWidth={2.5}/>
          {p.currentStock<1 ? "Out of Stock" : cfg.label}
        </span>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ProductDetailModal({ product:p, onClose }:{ product:LookupProduct; onClose:()=>void }) {
  const cfg    = STATUS_CFG[p.status] ?? STATUS_CFG.NORMAL;
  const Icon   = cfg.icon;
  const isLow  = p.currentStock <= p.lowStockThreshold;
  const catClr = CAT_COLOR[p.category] ?? { bg:"#f1f5f9", color:"#475569" };
  const stockPct = Math.min(100, Math.round(p.currentStock / Math.max(p.lowStockThreshold*3,1) * 100));

  return (
    <div
  onClick={onClose}
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    background: "rgba(15,23,42,0.55)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    overflowY: "auto",
  }}
>
      <div
  onClick={e => e.stopPropagation()}
  style={{
    background: "#fff",
    borderRadius: 14,
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
    overflow: "hidden",
    animation: "modal-in 0.2s cubic-bezier(0.22,1,0.36,1)",
    margin: "auto",
    position: "relative",
  }}
>
        {/* Hero image */}
        <div style={{
          height:180, overflow:"hidden",
          background:`linear-gradient(135deg, ${catClr.bg} 0%, ${catClr.bg}66 100%)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          position:"relative",
        }}>
          {p.imageUrl
            ? <img src={p.imageUrl} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{ fontSize:72, lineHeight:1 }}>{CAT_EMOJI[p.category] ?? "📦"}</span>}

          {/* Close */}
          <button onClick={onClose} style={{
            position:"absolute", top:12, right:12,
            width:32, height:32, borderRadius:"50%",
            background:"rgba(255,255,255,0.90)",
            border:"1px solid rgba(0,0,0,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"#374151",
            boxShadow:"0 2px 8px rgba(0,0,0,0.12)",
          }}>
            <X size={15} strokeWidth={2.5}/>
          </button>

          {/* Status + Price overlays */}
          <div style={{
            position:"absolute", bottom:12, left:12, right:12,
            display:"flex", justifyContent:"space-between", alignItems:"flex-end",
          }}>
            <span style={{
              display:"inline-flex", alignItems:"center", gap:5,
              fontSize:12, fontWeight:700,
              background:"rgba(255,255,255,0.92)",
              color:cfg.color, padding:"5px 12px",
              borderRadius:99, backdropFilter:"blur(4px)",
              border:`1px solid ${cfg.border}`,
            }}>
              <Icon size={12} strokeWidth={2.5}/>{cfg.label}
            </span>
            <span style={{
              background:"rgba(15,23,42,0.85)",
              color:"#fff", fontSize:18, fontWeight:800,
              padding:"6px 14px", borderRadius:99,
              backdropFilter:"blur(4px)",
              letterSpacing:"-0.02em",
            }}>
              ₱{parseFloat(p.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding:"20px 24px 22px" }}>
          {/* Category chip */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            fontSize:12, fontWeight:700,
            background:catClr.bg, color:catClr.color,
            padding:"4px 11px", borderRadius:99, marginBottom:10,
          }}>
            {CAT_EMOJI[p.category] ?? "📦"} {p.category}
          </div>

          {/* Name */}
          <div style={{
            fontSize:21, fontWeight:800, color:"#0f172a",
            letterSpacing:"-0.025em", marginBottom:18, lineHeight:1.25,
          }}>
            {p.name}
          </div>

          {/* Stock bar */}
          <div style={{
            background: isLow ? "#fff7ed" : "#f0fdf4",
            border:`1px solid ${isLow ? "#fed7aa" : "#bbf7d0"}`,
            borderRadius:12, padding:"14px 16px", marginBottom:14,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Stock Level</span>
              <span style={{
                fontSize:16, fontWeight:800,
                color: p.currentStock<1?"#b91c1c":isLow?"#c2410c":"#15803d",
                letterSpacing:"-0.02em",
              }}>
                {p.currentStock} units
                {isLow && <span style={{fontSize:11,fontWeight:600,marginLeft:6}}>⚠ Below threshold</span>}
              </span>
            </div>
            <div style={{ height:8, background:"rgba(0,0,0,0.08)", borderRadius:99, overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:99,
                width:`${stockPct}%`,
                background: p.currentStock<1?"#dc2626":isLow?"#ea580c":"#16a34a",
                transition:"width 0.3s",
              }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:11, color:"#94a3b8" }}>0</span>
              <span style={{ fontSize:11, color:"#94a3b8" }}>Min threshold: {p.lowStockThreshold}</span>
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[
              { label:"Shelf Location", value:p.shelfLocation??  "Not set",   icon:MapPin },
              { label:"Barcode",        value:p.barcode??        "Not set",   icon:Barcode },
            ].map(row => (
              <div key={row.label} style={{
                background:"#f8fafc", borderRadius:10,
                padding:"12px 14px", border:"1px solid #f1f5f9",
              }}>
                <div style={{
                  display:"flex", alignItems:"center", gap:5,
                  fontSize:11.5, color:"#94a3b8", fontWeight:500, marginBottom:5,
                }}>
                  <row.icon size={12} strokeWidth={2}/>{row.label}
                </div>
                <div style={{
                  fontSize:13.5, fontWeight:700, color:"#0f172a",
                  fontFamily: row.label==="Barcode"?"DM Mono, monospace":"DM Sans, sans-serif",
                }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:"12px 24px 18px",
          borderTop:"1px solid #f1f5f9",
          display:"flex", justifyContent:"flex-end",
        }}>
          <button onClick={onClose} style={{
            padding:"9px 24px", borderRadius:9,
            border:"1px solid #e2e8f0", background:"#fff",
            color:"#374151", fontSize:13.5, fontWeight:600,
            fontFamily:"DM Sans, sans-serif", cursor:"pointer",
            transition:"background 0.12s",
          }}
          onMouseEnter={e=>((e.currentTarget as HTMLButtonElement).style.background="#f8fafc")}
          onMouseLeave={e=>((e.currentTarget as HTMLButtonElement).style.background="#fff")}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
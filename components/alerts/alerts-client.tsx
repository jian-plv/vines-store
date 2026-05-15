"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle, Clock, XCircle, CheckCircle2,
  RotateCcw, Tag, Bell, RefreshCw, Loader2,
  ChevronDown, ChevronUp, X,
} from "lucide-react";
import {
  resolveAlert,
  reorderProduct,
  applyDiscount,
  autoDetectAlerts,
} from "../../lib/actions/alerts";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AlertItem = {
  id:          string;
  type:        string;
  productId:   string;
  productName: string;
  detail:      string;
  message:     string;
  isResolved:  boolean;
  resolvedAt:  string | null;
  createdAt:   string;
  dateLabel:   string;
};

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key:         "LOW_STOCK",
    label:       "Low Stock",
    icon:        AlertTriangle,
    iconBg:      "#fff7ed",
    iconClr:     "#ea580c",
    badgeBg:     "#ffedd5",
    badgeClr:    "#c2410c",
    cardBorder:  "#fed7aa",
    emptyMsg:    "No low-stock alerts — all products are well-stocked!",
  },
  {
    key:         "NEAR_EXPIRY",
    label:       "Near Expiry",
    icon:        Clock,
    iconBg:      "#fffbeb",
    iconClr:     "#d97706",
    badgeBg:     "#fef3c7",
    badgeClr:    "#b45309",
    cardBorder:  "#fde68a",
    emptyMsg:    "No near-expiry alerts — all products are fresh!",
  },
  {
    key:         "EXPIRED",
    label:       "Expired",
    icon:        XCircle,
    iconBg:      "#fef2f2",
    iconClr:     "#dc2626",
    badgeBg:     "#fee2e2",
    badgeClr:    "#b91c1c",
    cardBorder:  "#fecaca",
    emptyMsg:    "No expired product alerts.",
  },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

// ─── Discount Modal ───────────────────────────────────────────────────────────

function DiscountModal({
  alert,
  onConfirm,
  onCancel,
  loading,
}: {
  alert:     AlertItem;
  onConfirm: (pct: number) => void;
  onCancel:  () => void;
  loading:   boolean;
}) {
  const [percent, setPercent] = useState(50);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(15,23,42,0.5)",
      backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14,
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.20)",
        overflow: "hidden",
      }}>
        {/* Amber top bar */}
        <div style={{ height: 4, background: "#d97706" }} />

        <div style={{ padding: "22px 24px 20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10,
                background: "#fef3c7",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Tag size={18} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  Apply Discount
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
                  {alert.productName}
                </div>
              </div>
            </div>
            <button onClick={onCancel} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", display: "flex", padding: 4,
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Alert detail */}
          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 8, padding: "10px 14px", marginBottom: 18,
            fontSize: 13, color: "#92400e",
          }}>
            ⏱ {alert.detail}
          </div>

          {/* Discount selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600,
              color: "#374151", marginBottom: 10 }}>
              Select Discount Percentage
            </label>

            {/* Preset buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
              {[10, 20, 30, 50].map((pct) => (
                <button key={pct} onClick={() => setPercent(pct)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 8,
                    border: `2px solid ${percent === pct ? "#d97706" : "#e2e8f0"}`,
                    background: percent === pct ? "#fef3c7" : "#fff",
                    color:      percent === pct ? "#b45309" : "#374151",
                    fontSize: 14, fontWeight: percent === pct ? 800 : 500,
                    cursor: "pointer", transition: "all 0.12s",
                  }}>
                  {pct}%
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Custom:</span>
              <input
                type="number" min="1" max="99"
                value={percent}
                onChange={(e) => setPercent(Math.min(99, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{
                  width: 80, padding: "7px 10px",
                  border: "1px solid #e2e8f0", borderRadius: 8,
                  fontSize: 14, fontWeight: 700, textAlign: "center",
                  fontFamily: "DM Sans, sans-serif", outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#d97706";
                  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(217,119,6,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow   = "none";
                }}
              />
              <span style={{ fontSize: 13, color: "#64748b" }}>%</span>
            </div>
          </div>

          {/* Preview */}
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 8, padding: "12px 14px", marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>
                New price after {percent}% discount:
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>
                Original price will be saved
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d",
              letterSpacing: "-0.03em" }}>
              -{percent}%
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onCancel} style={{
              padding: "9px 18px", borderRadius: 8,
              border: "1px solid #e2e8f0", background: "#fff",
              color: "#374151", fontSize: 13.5, fontWeight: 600,
              fontFamily: "DM Sans, sans-serif", cursor: "pointer",
            }}>
              Cancel
            </button>
            <button onClick={() => onConfirm(percent)} disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 8,
                border: "none",
                background: loading ? "#fde68a" : "#d97706",
                color: "#fff",
                fontSize: 13.5, fontWeight: 700,
                fontFamily: "DM Sans, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(217,119,6,0.25)",
              }}>
              {loading
                ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />Applying…</>
                : <><Tag size={14} />Apply {percent}% Discount</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

const VARIANTS = {
  resolve:  { bg:"#f0fdf4", border:"#bbf7d0", color:"#15803d", hover:"#dcfce7" },
  reorder:  { bg:"#eff6ff", border:"#bfdbfe", color:"#1d4ed8", hover:"#dbeafe" },
  discount: { bg:"#fefce8", border:"#fde68a", color:"#b45309", hover:"#fef3c7" },
} as const;

function Btn({ icon, label, loading, onClick, disabled, variant }:
  { icon:React.ReactNode; label:string; loading:boolean;
    onClick:()=>void; disabled:boolean; variant:keyof typeof VARIANTS }) {
  const s = VARIANTS[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display:"inline-flex", alignItems:"center", gap:6,
        padding:"5px 12px", border:`1px solid ${s.border}`, borderRadius:7,
        background:s.bg, color:s.color, fontSize:12.5, fontWeight:600,
        fontFamily:"DM Sans, sans-serif",
        cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.6:1, transition:"background 0.12s" }}
      onMouseEnter={e=>{if(!disabled)(e.currentTarget as HTMLButtonElement).style.background=s.hover;}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=s.bg;}}>
      {loading
        ? <Loader2 size={12} style={{animation:"spin 0.7s linear infinite"}}/>
        : icon}
      {label}
    </button>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 100,
      background: "#15803d", color: "#fff",
      padding: "13px 18px", borderRadius: 10,
      fontSize: 13.5, fontWeight: 600,
      boxShadow: "0 8px 28px rgba(21,128,61,0.35)",
      display: "flex", alignItems: "center", gap: 10,
      animation: "toast-in 0.25s ease both",
      maxWidth: 380,
    }}>
      <CheckCircle2 size={17} />
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none",
        cursor: "pointer", color: "rgba(255,255,255,0.7)",
        display: "flex", padding: 2,
      }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AlertsClient({
  alerts:      initAlerts,
  totalActive,
}: {
  alerts:      AlertItem[];
  totalActive: number;
}) {
  const [alerts,       setAlerts]       = useState(initAlerts);
  const [filter,       setFilter]       = useState<"All"|"Active"|"Resolved">("Active");
  const [collapsed,    setCollapsed]    = useState<Record<SectionKey,boolean>>({
    LOW_STOCK: false, NEAR_EXPIRY: false, EXPIRED: false,
  });
  const [loadingId,    setLoadingId]    = useState<string|null>(null);
  const [detecting,    setDetecting]    = useState(false);
  const [toast,        setToast]        = useState("");
  const [discountAlert,setDiscountAlert]= useState<AlertItem|null>(null);
  const [, start] = useTransition();

  const activeCounts = {
    LOW_STOCK:   alerts.filter(a=>a.type==="LOW_STOCK"   &&!a.isResolved).length,
    NEAR_EXPIRY: alerts.filter(a=>a.type==="NEAR_EXPIRY" &&!a.isResolved).length,
    EXPIRED:     alerts.filter(a=>a.type==="EXPIRED"     &&!a.isResolved).length,
  };

  const visible = alerts.filter(a => {
    if (filter==="Active")   return !a.isResolved;
    if (filter==="Resolved") return  a.isResolved;
    return true;
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  }

  // ── Generic action runner ─────────────────────────────────────────────────
  function runAction(key: string, fn: () => Promise<void>) {
    setLoadingId(key);
    start(async () => {
      try {
        await fn();
        window.location.reload();
      } catch (err: any) {
        console.error(err);
        showToast(`Error: ${err.message ?? "Something went wrong."}`);
        setLoadingId(null);
      }
    });
  }

  // ── Apply discount with modal ─────────────────────────────────────────────
  function handleDiscountConfirm(pct: number) {
    if (!discountAlert) return;
    const id = discountAlert.id;
    setLoadingId(id + "-discount");
    start(async () => {
      try {
        const result = await applyDiscount(id, pct);
        setDiscountAlert(null);
        window.location.reload();
      } catch (err: any) {
        console.error(err);
        showToast(`Error: ${err.message ?? "Discount failed."}`);
        setLoadingId(null);
      }
    });
  }

  // ── Auto detect ───────────────────────────────────────────────────────────
  async function handleDetect() {
    setDetecting(true);
    try {
      const r = await autoDetectAlerts();
      showToast(
        r.created > 0
          ? `✓ ${r.created} new alert${r.created!==1?"s":""} detected.`
          : "✓ All alerts are up to date."
      );
      window.location.reload();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      {/* Discount Modal */}
      {discountAlert && (
        <DiscountModal
          alert={discountAlert}
          onConfirm={handleDiscountConfirm}
          onCancel={() => setDiscountAlert(null)}
          loading={loadingId === discountAlert.id + "-discount"}
        />
      )}

      {/* Count Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        gap:16, marginBottom:24 }}>
        {SECTIONS.map(s => {
          const Icon=s.icon; const count=activeCounts[s.key];
          return (
            <div key={s.key} style={{ background:s.iconBg,
              border:`1px solid ${s.cardBorder}`, borderRadius:12,
              padding:"18px 20px", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:44, height:44, borderRadius:12,
                background:s.badgeBg, border:`1px solid ${s.cardBorder}`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon size={22} color={s.iconClr} strokeWidth={2}/>
              </div>
              <div>
                <div style={{ fontSize:30, fontWeight:800, color:s.badgeClr,
                  letterSpacing:"-0.05em", lineHeight:1 }}>{count}</div>
                <div style={{ fontSize:12.5, fontWeight:600, color:s.badgeClr,
                  marginTop:3, opacity:0.85 }}>
                  {s.label} {count===1?"alert":"alerts"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:20,
        flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6 }}>
          {(["All","Active","Resolved"] as const).map(f => {
            const active=filter===f;
            return (
              <button key={f} onClick={()=>setFilter(f)}
                style={{ padding:"6px 16px", borderRadius:99,
                  border:"1px solid", cursor:"pointer",
                  borderColor:active?"#16a34a":"#e2e8f0",
                  background:active?"#16a34a":"#fff",
                  color:active?"#fff":"#64748b",
                  fontSize:13, fontWeight:active?700:500,
                  fontFamily:"DM Sans, sans-serif",
                  transition:"all 0.12s" }}>
                {f}
                {f==="Active"&&totalActive>0&&(
                  <span style={{ marginLeft:6,
                    background:active?"rgba(255,255,255,0.25)":"#fee2e2",
                    color:active?"#fff":"#dc2626",
                    fontSize:10.5, fontWeight:800,
                    padding:"1px 6px", borderRadius:99 }}>
                    {totalActive}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={handleDetect} disabled={detecting}
          style={{ display:"flex", alignItems:"center", gap:7,
            padding:"7px 14px", border:"1px solid #e2e8f0",
            borderRadius:8, background:"#fff", color:"#374151",
            fontSize:13, fontWeight:600, fontFamily:"DM Sans, sans-serif",
            cursor:detecting?"not-allowed":"pointer",
            opacity:detecting?0.6:1, transition:"all 0.12s" }}
          onMouseEnter={e=>{if(!detecting)(e.currentTarget as HTMLButtonElement).style.background="#f8fafc";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="#fff";}}>
          {detecting
            ? <Loader2 size={14} style={{animation:"spin 0.7s linear infinite"}}/>
            : <RefreshCw size={14}/>}
          Auto-detect Alerts
        </button>
      </div>

      {/* Three sections */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {SECTIONS.map(section => {
          const Icon=section.icon;
          const sectionAlerts=visible.filter(a=>a.type===section.key);
          const isCol=collapsed[section.key];
          return (
            <div key={section.key} style={{ background:"#fff",
              border:"1px solid #e2e8f0", borderRadius:12,
              overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>

              {/* Section header */}
              <button
                onClick={()=>setCollapsed(p=>({...p,[section.key as SectionKey]:!p[section.key as SectionKey]}))}
                style={{ width:"100%", display:"flex", alignItems:"center",
                  gap:12, padding:"14px 20px", background:"none", border:"none",
                  borderBottom:isCol?"none":"1px solid #f1f5f9",
                  cursor:"pointer", textAlign:"left",
                  fontFamily:"DM Sans, sans-serif" }}>
                <div style={{ width:34, height:34, borderRadius:9,
                  background:section.iconBg, border:`1px solid ${section.cardBorder}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0 }}>
                  <Icon size={17} color={section.iconClr} strokeWidth={2.2}/>
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:"#0f172a",
                  flex:1, letterSpacing:"-0.01em" }}>{section.label}</span>
                {activeCounts[section.key]>0&&(
                  <span style={{ background:section.badgeBg,
                    color:section.badgeClr, fontSize:11.5, fontWeight:800,
                    padding:"3px 10px", borderRadius:99,
                    border:`1px solid ${section.cardBorder}` }}>
                    {activeCounts[section.key]} active
                  </span>
                )}
                {isCol
                  ? <ChevronDown size={16} color="#94a3b8"/>
                  : <ChevronUp   size={16} color="#94a3b8"/>}
              </button>

              {/* Alert cards */}
              {!isCol&&(
                <div style={{ padding:"4px 0 8px" }}>
                  {sectionAlerts.length===0 ? (
                    <div style={{ padding:"28px 20px", textAlign:"center",
                      color:"#94a3b8", fontSize:13.5 }}>
                      {filter==="Resolved"
                        ? `No resolved ${section.label.toLowerCase()} alerts.`
                        : section.emptyMsg}
                    </div>
                  ) : sectionAlerts.map(alert => {
                    const isResThis  = loadingId===alert.id;
                    const isReord    = loadingId===alert.id+"-reorder";
                    const isDisc     = loadingId===alert.id+"-discount";
                    const anyLoad    = isResThis||isReord||isDisc;

                    return (
                      <div key={alert.id} style={{
                        display:"flex", alignItems:"flex-start",
                        gap:14, padding:"14px 20px",
                        borderBottom:"1px solid #f8fafc",
                        opacity:alert.isResolved?0.55:1,
                        transition:"opacity 0.2s" }}>

                        {/* Icon */}
                        <div style={{ width:38, height:38, borderRadius:10,
                          background:section.iconBg,
                          border:`1px solid ${section.cardBorder}`,
                          display:"flex", alignItems:"center",
                          justifyContent:"center", flexShrink:0, marginTop:1 }}>
                          <Icon size={18} color={section.iconClr} strokeWidth={2}/>
                        </div>

                        {/* Content */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13.5, fontWeight:700,
                            color:"#0f172a", marginBottom:3 }}>
                            {alert.productName}
                          </div>
                          <div style={{ fontSize:13, color:"#64748b",
                            marginBottom:alert.isResolved?0:8 }}>
                            {alert.detail}
                          </div>

                          {/* Action buttons */}
                          {!alert.isResolved&&(
                            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>

                              {/* Mark as Resolved */}
                              <Btn
                                icon={<CheckCircle2 size={13} strokeWidth={2.5}/>}
                                label="Mark as Resolved"
                                loading={isResThis}
                                onClick={() => runAction(
                                  alert.id,
                                  () => resolveAlert(alert.id)
                                )}
                                disabled={anyLoad}
                                variant="resolve"
                              />

                              {/* Reorder (LOW_STOCK only) */}
                              {alert.type==="LOW_STOCK"&&(
                                <Btn
                                  icon={<RotateCcw size={13} strokeWidth={2.5}/>}
                                  label="Reorder"
                                  loading={isReord}
                                  onClick={() => runAction(
                                    alert.id + "-reorder",
                                    () => reorderProduct(alert.id, alert.productId)
                                  )}
                                  disabled={anyLoad}
                                  variant="reorder"
                                />
                              )}

                              {/* Apply Discount (NEAR_EXPIRY only) */}
                              {alert.type==="NEAR_EXPIRY"&&(
                                <Btn
                                  icon={<Tag size={13} strokeWidth={2.5}/>}
                                  label="Apply Discount"
                                  loading={isDisc}
                                  onClick={() => setDiscountAlert(alert)}
                                  disabled={anyLoad}
                                  variant="discount"
                                />
                              )}
                            </div>
                          )}

                          {/* Resolved state */}
                          {alert.isResolved&&(
                            <div style={{ display:"inline-flex",
                              alignItems:"center", gap:5,
                              fontSize:12, color:"#16a34a", fontWeight:600 }}>
                              <CheckCircle2 size={13} strokeWidth={2.5}/> Resolved
                              {alert.resolvedAt&&(
                                <span style={{ color:"#94a3b8",
                                  fontWeight:400, marginLeft:4 }}>
                                  {new Date(alert.resolvedAt).toLocaleDateString("en-PH",{
                                    month:"short", day:"numeric"
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Badge + date */}
                        <div style={{ display:"flex", flexDirection:"column",
                          alignItems:"flex-end", gap:6, flexShrink:0 }}>
                          <span style={{ fontSize:11.5, fontWeight:700,
                            background:section.badgeBg, color:section.badgeClr,
                            padding:"3px 10px", borderRadius:99,
                            border:`1px solid ${section.cardBorder}`,
                            whiteSpace:"nowrap" }}>
                            {section.label}
                          </span>
                          <span style={{ fontSize:11.5, color:"#94a3b8" }}>
                            {alert.dateLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visible.length===0&&(
        <div style={{ marginTop:20, padding:"48px 24px", textAlign:"center",
          background:"#fff", border:"1px solid #e2e8f0", borderRadius:12,
          color:"#94a3b8" }}>
          <Bell size={40} strokeWidth={1.5} style={{ marginBottom:12, opacity:0.35 }}/>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>
            {filter==="Resolved"?"No resolved alerts yet.":"🎉 No active alerts!"}
          </div>
          <div style={{ fontSize:13 }}>
            {filter==="Active"
              ?"All products are stocked and fresh."
              :"Alerts you resolve will appear here."}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
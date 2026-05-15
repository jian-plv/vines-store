"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle, Clock, XCircle, CheckCircle2,
  RefreshCw, Loader2, Bell,
} from "lucide-react";
import { resolveAlert, autoDetectAlerts } from "../../lib/actions/alerts";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StaffAlert = {
  id:          string;
  type:        string;
  productId:   string;
  productName: string;
  detail:      string;
  isResolved:  boolean;
  resolvedAt:  string | null;
  createdAt:   string;
  dateLabel:   string;
};

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key:      "LOW_STOCK",
    label:    "Low Stock",
    icon:     AlertTriangle,
    cardBg:   "#fff7ed",
    cardBdr:  "#fed7aa",
    iconBg:   "#ffedd5",
    iconClr:  "#ea580c",
    badgeBg:  "#ffedd5",
    badgeClr: "#c2410c",
    emptyMsg: "No low-stock alerts — all products are well-stocked!",
    emptyEmoji: "✅",
  },
  {
    key:      "NEAR_EXPIRY",
    label:    "Near Expiry",
    icon:     Clock,
    cardBg:   "#fffbeb",
    cardBdr:  "#fde68a",
    iconBg:   "#fef3c7",
    iconClr:  "#d97706",
    badgeBg:  "#fef3c7",
    badgeClr: "#b45309",
    emptyMsg: "No near-expiry alerts — all products are fresh!",
    emptyEmoji: "🌿",
  },
  {
    key:      "EXPIRED",
    label:    "Expired",
    icon:     XCircle,
    cardBg:   "#fef2f2",
    cardBdr:  "#fecaca",
    iconBg:   "#fee2e2",
    iconClr:  "#dc2626",
    badgeBg:  "#fee2e2",
    badgeClr: "#b91c1c",
    emptyMsg: "No expired product alerts.",
    emptyEmoji: "👍",
  },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

// ─── Main Component ───────────────────────────────────────────────────────────

export function StaffAlertsClient({
  alerts:      initAlerts,
  totalActive,
}: {
  alerts:      StaffAlert[];
  totalActive: number;
}) {
  const [alerts,    setAlerts]    = useState(initAlerts);
  const [filter,    setFilter]    = useState<"Active" | "All">("Active");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detMsg,    setDetMsg]    = useState("");
  const [toast,     setToast]     = useState("");
  const [, start] = useTransition();

  // ── Counts ────────────────────────────────────────────────────────────────
  const activeCounts = {
    LOW_STOCK:   alerts.filter(a => a.type === "LOW_STOCK"   && !a.isResolved).length,
    NEAR_EXPIRY: alerts.filter(a => a.type === "NEAR_EXPIRY" && !a.isResolved).length,
    EXPIRED:     alerts.filter(a => a.type === "EXPIRED"     && !a.isResolved).length,
  };
  const totalCount = Object.values(activeCounts).reduce((a, b) => a + b, 0);

  // ── Filtered alerts ───────────────────────────────────────────────────────
  const visible = filter === "Active"
    ? alerts.filter(a => !a.isResolved)
    : alerts;

  // ── Resolve ───────────────────────────────────────────────────────────────
  function handleResolve(id: string, productName: string) {
    setLoadingId(id);
    start(async () => {
      try {
        await resolveAlert(id);
        setAlerts(prev =>
          prev.map(a => a.id === id
            ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() }
            : a
          )
        );
        showToast(`✓ "${productName}" alert resolved`);
      } catch (err: any) {
        showToast(`Error: ${err.message ?? "Failed to resolve"}`);
      } finally {
        setLoadingId(null);
      }
    });
  }

  // ── Auto-detect ───────────────────────────────────────────────────────────
  async function handleDetect() {
    setDetecting(true);
    setDetMsg("");
    try {
      const result = await autoDetectAlerts();
      const msg = result.created > 0
        ? `${result.created} new alert${result.created !== 1 ? "s" : ""} found`
        : "All alerts are up to date";
      setDetMsg(msg);
      showToast(`✓ ${msg}`);
      setTimeout(() => {
        setDetMsg("");
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      showToast(`Error: ${err.message ?? "Detection failed"}`);
    } finally {
      setDetecting(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: toast.startsWith("Error") ? "#dc2626" : "#15803d",
          color: "#fff",
          padding: "13px 20px", borderRadius: 12,
          fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 28px rgba(0,0,0,0.20)",
          display: "flex", alignItems: "center", gap: 9,
          animation: "toast-in 0.25s ease both",
          maxWidth: 380,
        }}>
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}

      {/* ── Summary count cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        marginBottom: 20,
      }}>
        {SECTIONS.map(s => {
          const Icon  = s.icon;
          const count = activeCounts[s.key];
          return (
            <div key={s.key} style={{
              background:   s.cardBg,
              border:       `1px solid ${s.cardBdr}`,
              borderRadius: 14,
              padding:      "18px 20px",
              display:      "flex",
              alignItems:   "center",
              gap:          14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background:  s.iconBg,
                border:      `1px solid ${s.cardBdr}`,
                display:     "flex",
                alignItems:  "center",
                justifyContent: "center",
                flexShrink:  0,
              }}>
                <Icon size={24} color={s.iconClr} strokeWidth={2} />
              </div>
              <div>
                <div style={{
                  fontSize: 32, fontWeight: 800, color: s.badgeClr,
                  letterSpacing: "-0.05em", lineHeight: 1,
                }}>
                  {count}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: s.badgeClr,
                  marginTop: 3, opacity: 0.85,
                }}>
                  {s.label} {count === 1 ? "alert" : "alerts"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginBottom:   20,
        gap:            12,
        flexWrap:       "wrap",
      }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["Active", "All"] as const).map(f => {
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: "8px 20px", borderRadius: 99,
                  border: "1.5px solid",
                  borderColor:  active ? "#16a34a" : "#e2e8f0",
                  background:   active ? "#16a34a" : "#fff",
                  color:        active ? "#fff"    : "#64748b",
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  fontFamily: "DM Sans, sans-serif",
                  cursor: "pointer", transition: "all 0.13s",
                }}>
                {f}
                {f === "Active" && totalCount > 0 && (
                  <span style={{
                    marginLeft: 7,
                    background: active ? "rgba(255,255,255,0.3)" : "#fee2e2",
                    color:      active ? "#fff" : "#dc2626",
                    fontSize: 11.5, fontWeight: 800,
                    padding: "1px 7px", borderRadius: 99,
                  }}>
                    {totalCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Auto-detect button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {detMsg && (
            <span style={{ fontSize: 13.5, color: "#15803d", fontWeight: 600 }}>
              ✓ {detMsg}
            </span>
          )}
          <button
            onClick={handleDetect}
            disabled={detecting}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px",
              border: "1.5px solid #e2e8f0", borderRadius: 9,
              background: "#fff", color: "#374151",
              fontSize: 13.5, fontWeight: 600,
              fontFamily: "DM Sans, sans-serif",
              cursor: detecting ? "not-allowed" : "pointer",
              opacity: detecting ? 0.65 : 1,
              transition: "all 0.13s",
            }}
            onMouseEnter={e => {
              if (!detecting)
                (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            }}
          >
            {detecting
              ? <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />
              : <RefreshCw size={15} />}
            Auto-detect Alerts
          </button>
        </div>
      </div>

      {/* ── All clear state ── */}
      {visible.length === 0 && (
        <div style={{
          padding: "64px 24px", textAlign: "center",
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 16, color: "#94a3b8",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#374151", marginBottom: 6 }}>
            {filter === "Active" ? "All clear!" : "No alerts yet"}
          </div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
            {filter === "Active"
              ? "No active alerts right now. All products are stocked and fresh."
              : "No alerts have been generated yet. Click Auto-detect to scan."}
          </div>
        </div>
      )}

      {/* ── Three sections ── */}
      {visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SECTIONS.map(section => {
            const Icon          = section.icon;
            const sectionAlerts = visible.filter(a => a.type === section.key);
            const activeCount   = activeCounts[section.key];

            return (
              <div key={section.key} style={{
                background:   "#fff",
                border:       "1px solid #e2e8f0",
                borderRadius: 14,
                overflow:     "hidden",
                boxShadow:    "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                {/* Section header */}
                <div style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         12,
                  padding:     "15px 20px 13px",
                  borderBottom: sectionAlerts.length > 0
                    ? "1px solid #f1f5f9"
                    : "none",
                  background: sectionAlerts.length > 0 ? "#fff" : "#fafafa",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background:  section.iconBg,
                    border:      `1px solid ${section.cardBdr}`,
                    display:     "flex",
                    alignItems:  "center",
                    justifyContent: "center",
                    flexShrink:  0,
                  }}>
                    <Icon size={18} color={section.iconClr} strokeWidth={2.2} />
                  </div>

                  <span style={{
                    fontSize: 15, fontWeight: 700, color: "#0f172a",
                    flex: 1, letterSpacing: "-0.01em",
                  }}>
                    {section.label}
                  </span>

                  {activeCount > 0 ? (
                    <span style={{
                      background:  section.badgeBg,
                      color:       section.badgeClr,
                      fontSize:    12, fontWeight: 800,
                      padding:     "4px 12px", borderRadius: 99,
                      border:      `1px solid ${section.cardBdr}`,
                    }}>
                      {activeCount} active
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 12.5, color: "#16a34a",
                      fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <CheckCircle2 size={14} strokeWidth={2.5} /> All clear
                    </span>
                  )}
                </div>

                {/* Alert cards */}
                {sectionAlerts.length === 0 ? (
                  <div style={{
                    padding: "24px 20px",
                    display: "flex", alignItems: "center", gap: 12,
                    color: "#94a3b8",
                  }}>
                    <span style={{ fontSize: 22 }}>{section.emptyEmoji}</span>
                    <span style={{ fontSize: 13.5 }}>{section.emptyMsg}</span>
                  </div>
                ) : (
                  <div>
                    {sectionAlerts.map((alert, idx) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        section={section}
                        isLast={idx === sectionAlerts.length - 1}
                        loading={loadingId === alert.id}
                        anyLoading={loadingId !== null}
                        onResolve={() => handleResolve(alert.id, alert.productName)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes toast-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}

// ─── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert, section, isLast, loading, anyLoading, onResolve,
}: {
  alert:      StaffAlert;
  section:    typeof SECTIONS[number];
  isLast:     boolean;
  loading:    boolean;
  anyLoading: boolean;
  onResolve:  () => void;
}) {
  const Icon = section.icon;

  return (
    <div style={{
      display:     "flex",
      alignItems:  "center",
      gap:         14,
      padding:     "16px 20px",
      borderBottom: isLast ? "none" : "1px solid #f8fafc",
      background:  alert.isResolved ? "#fafafa" : "#fff",
      opacity:     alert.isResolved ? 0.6 : 1,
      transition:  "opacity 0.2s",
    }}>
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background:  section.iconBg,
        border:      `1px solid ${section.cardBdr}`,
        display:     "flex",
        alignItems:  "center",
        justifyContent: "center",
      }}>
        <Icon size={22} color={section.iconClr} strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Product name */}
        <div style={{
          fontSize: 15, fontWeight: 700, color: "#0f172a",
          marginBottom: 3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {alert.productName}
        </div>

        {/* Detail */}
        <div style={{ fontSize: 13.5, color: "#64748b", marginBottom: 4 }}>
          {alert.detail}
        </div>

        {/* Date */}
        <div style={{
          fontSize: 12, color: "#94a3b8", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span>🕐</span> {alert.dateLabel}
        </div>
      </div>

      {/* Right side: badge + button */}
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "flex-end",
        gap:            8,
        flexShrink:     0,
      }}>
        {/* Type badge */}
        <span style={{
          fontSize:    11.5, fontWeight: 700,
          background:  section.badgeBg,
          color:       section.badgeClr,
          padding:     "3px 10px", borderRadius: 99,
          border:      `1px solid ${section.cardBdr}`,
          whiteSpace:  "nowrap",
        }}>
          {section.label}
        </span>

        {/* Resolve button / Resolved state */}
        {!alert.isResolved ? (
          <button
            onClick={onResolve}
            disabled={anyLoading}
            style={{
              display:     "flex",
              alignItems:  "center",
              gap:         6,
              padding:     "8px 16px",
              borderRadius: 9,
              border:      "1.5px solid #bbf7d0",
              background:  anyLoading ? "#f8fafc" : "#f0fdf4",
              color:       anyLoading ? "#94a3b8"  : "#15803d",
              fontSize:    13, fontWeight: 700,
              fontFamily:  "DM Sans, sans-serif",
              cursor:      anyLoading ? "not-allowed" : "pointer",
              opacity:     anyLoading && !loading ? 0.6 : 1,
              transition:  "all 0.13s",
              whiteSpace:  "nowrap",
            }}
            onMouseEnter={e => {
              if (!anyLoading)
                (e.currentTarget as HTMLButtonElement).style.background = "#dcfce7";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background =
                anyLoading ? "#f8fafc" : "#f0fdf4";
            }}
          >
            {loading
              ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
              : <CheckCircle2 size={14} strokeWidth={2.5} />}
            {loading ? "Resolving…" : "Mark as Resolved"}
          </button>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 12.5, color: "#16a34a", fontWeight: 600,
          }}>
            <CheckCircle2 size={14} strokeWidth={2.5} />
            Resolved
            {alert.resolvedAt && (
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                · {new Date(alert.resolvedAt).toLocaleDateString("en-PH", {
                  month: "short", day: "numeric",
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
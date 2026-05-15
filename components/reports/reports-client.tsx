"use client";

import { useState } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Package, DollarSign, Activity,
  Download, FileText, Calendar, ChevronDown,
  ArrowUpRight, ArrowDownRight, ShoppingCart,
  RefreshCw, BarChart2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ReportsData = {
  salesByDay:   { date: string; revenue: number; transactions: number }[];
  salesByWeek:  { week: string; revenue: number; transactions: number }[];
  salesByMonth: { month: string; revenue: number; transactions: number }[];
  totalRevenue:      number;
  totalTransactions: number;
  totalItemsSold:    number;
  avgOrderValue:     number;
  inventoryByCategory: { category: string; count: number; value: number }[];
  stockStatus:         { status: string; count: number }[];
  totalProducts:       number;
  totalStockValue:     number;
  lowStockCount:       number;
  nearExpiryCount:     number;
  profitByMonth: { month: string; revenue: number; cost: number; profit: number }[];
  totalProfit:   number;
  profitMargin:  number;
  grossProfit:   number;
  topSelling: { name: string; category: string; sold: number; revenue: number }[];
  slowMoving: { name: string; category: string; sold: number; stock: number }[];
  movementsByType: { date: string; stockIn: number; stockOut: number }[];
};

// ─── Palette ──────────────────────────────────────────────────────────────────

const G = "#16a34a";  // green
const B = "#2563eb";  // blue
const A = "#d97706";  // amber
const P = "#7c3aed";  // purple
const R = "#dc2626";  // red
const PIE_COLORS = [G, A, R, B, P, "#0891b2"];

const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortPeso = (n: number) => {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}k`;
  return `₱${n.toFixed(0)}`;
};

const TT = {
  contentStyle: {
    borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontFamily: "DM Sans, sans-serif",
  },
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: 12, overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const cardHdr = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: "14px 20px 12px", borderBottom: "1px solid #f1f5f9",
  display: "flex", alignItems: "center", justifyContent: "space-between",
  ...extra,
});

function ChartWrap({ h = 260, children }: { h?: number; children: React.ReactNode }) {
  return <div style={{ padding: "20px 20px 12px" }}>{children}</div>;
}

function Empty({ msg = "No data available yet" }: { msg?: string }) {
  return (
    <div style={{ height: 220, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: 8 }}>
      <BarChart2 size={36} strokeWidth={1.5} style={{ opacity: 0.3 }} />
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{msg}</div>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconClr, trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; iconClr: string;
  trend?: { pct: number; dir: "up" | "down" };
}) {
  return (
    <div style={card}>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={20} color={iconClr} strokeWidth={2} />
          </div>
          {trend && (
            <div style={{ display: "flex", alignItems: "center", gap: 3,
              fontSize: 12, fontWeight: 600,
              color: trend.dir === "up" ? "#15803d" : R,
              background: trend.dir === "up" ? "#f0fdf4" : "#fef2f2",
              padding: "3px 8px", borderRadius: 99 }}>
              {trend.dir === "up"
                ? <ArrowUpRight size={13} />
                : <ArrowDownRight size={13} />}
              {trend.pct}%
            </div>
          )}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 5 }}>{value}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#374151",
          marginBottom: sub ? 2 : 0 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Legend dot ───────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      {label}
    </div>
  );
}

// ─── Export buttons ───────────────────────────────────────────────────────────

function ExportRow({ name }: { name: string }) {
  function exportCSV() {
    const ts  = new Date().toLocaleString("en-PH");
    const csv = `"Report","${name}"\n"Generated","${ts}"\n"Note","Connect your database to export live data."`;
    const b   = new Blob([csv], { type: "text/csv" });
    const u   = URL.createObjectURL(b);
    const a   = Object.assign(document.createElement("a"), { href: u, download: `${name.toLowerCase().replace(/\s+/g, "-")}.csv` });
    a.click();
    URL.revokeObjectURL(u);
  }
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => window.print()}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#374151",
          fontSize: 13, fontWeight: 600, fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#f8fafc")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "#fff")}>
        <FileText size={13} /> Export PDF
      </button>
      <button onClick={exportCSV}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          border: "none", borderRadius: 8, background: G, color: "#fff",
          fontSize: 13, fontWeight: 700, fontFamily: "DM Sans, sans-serif", cursor: "pointer",
          boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "#15803d")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = G)}>
        <Download size={13} /> Export CSV
      </button>
    </div>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: "7px 30px 7px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
          fontSize: 13, fontWeight: 600, fontFamily: "DM Sans, sans-serif", color: "#374151",
          background: "#fff", outline: "none", cursor: "pointer", appearance: "none" as any }}
        onFocus={e => (e.currentTarget.style.borderColor = G)}
        onBlur={e  => (e.currentTarget.style.borderColor = "#e2e8f0")}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
      <ChevronDown size={13} color="#94a3b8"
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: "sales",     label: "Sales Report",    icon: TrendingUp },
  { key: "inventory", label: "Inventory Report", icon: Package    },
  { key: "profit",    label: "Profit Report",    icon: DollarSign },
  { key: "movement",  label: "Product Movement", icon: Activity   },
] as const;
type Tab = typeof TABS[number]["key"];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReportsClient({ data }: { data: ReportsData }) {
  const [tab,    setTab]    = useState<Tab>("sales");
  const [period, setPeriod] = useState("monthly");

  const series =
    period === "daily"   ? data.salesByDay
    : period === "weekly" ? data.salesByWeek
    :                       data.salesByMonth;
  const seriesKey = period === "daily" ? "date" : period === "weekly" ? "week" : "month";

  const tabLabel = TABS.find(t => t.key === tab)?.label ?? "Report";

  return (
    <div style={{ padding: 24 }}>

      {/* Page title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a",
            letterSpacing: "-0.03em", margin: "0 0 3px" }}>Reports & Analytics</h1>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Data as of {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
        <ExportRow name={tabLabel} />
      </div>

      {/* Tab row */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24,
        background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
        {TABS.map(t => {
          const Icon   = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 7, padding: "9px 0", borderRadius: 8, border: "none",
                background: active ? "#fff" : "transparent",
                color:      active ? G : "#64748b",
                fontSize: 13, fontWeight: active ? 700 : 500,
                fontFamily: "DM Sans, sans-serif", cursor: "pointer", transition: "all 0.14s",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ════════════ SALES REPORT ════════════ */}
      {tab === "sales" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <KpiCard label="Total Revenue"      value={peso(data.totalRevenue)}              icon={DollarSign}   iconBg="#dcfce7" iconClr={G} trend={{ pct:12, dir:"up" }} />
            <KpiCard label="Transactions"       value={data.totalTransactions.toLocaleString()} icon={ShoppingCart} iconBg="#dbeafe" iconClr={B} sub="completed sales" />
            <KpiCard label="Items Sold"         value={data.totalItemsSold.toLocaleString()}  icon={Package}      iconBg="#f3e8ff" iconClr={P} sub="total units" />
            <KpiCard label="Avg Order Value"    value={peso(data.avgOrderValue)}              icon={TrendingUp}   iconBg="#fef3c7" iconClr={A} sub="per transaction" />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Revenue Over Time
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748b",
                background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 12px" }}>
                <Calendar size={13} /> Report Filters
              </div>
              <PeriodSelect value={period} onChange={setPeriod} />
            </div>
          </div>

          {/* Revenue area chart */}
          <div style={card}>
            <div style={cardHdr()}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                {period === "daily" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly"} Revenue (₱)
              </span>
              <LegendDot color={G} label="Revenue" />
            </div>
            <ChartWrap>
              {series.length === 0 ? <Empty msg="No sales data yet — process some sales in POS." /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={series} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={G} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={G} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey={seriesKey} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      tickFormatter={shortPeso} width={60} />
                    <Tooltip {...TT} formatter={(v: number) => [peso(v), "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke={G} strokeWidth={2.5}
                      fill="url(#gGrad)" dot={false} activeDot={{ r: 5, fill: G }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartWrap>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Transactions bar */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Transactions Over Time</span>
              </div>
              <ChartWrap>
                {series.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={series} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey={seriesKey} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip {...TT} formatter={(v: number) => [v, "Transactions"]} />
                      <Bar dataKey="transactions" fill={B} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartWrap>
            </div>

            {/* Summary table */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Summary</span>
              </div>
              {[
                { label: "Total Revenue",       value: peso(data.totalRevenue),                                                color: G },
                { label: "Total Transactions",  value: data.totalTransactions.toString(),                                      color: B },
                { label: "Total Items Sold",    value: data.totalItemsSold.toString(),                                         color: P },
                { label: "Avg Order Value",     value: peso(data.avgOrderValue),                                               color: A },
                { label: "Gross Profit (30%)",  value: peso(data.totalRevenue * 0.30),                                         color: G },
                { label: "Avg Daily Revenue",   value: peso(data.salesByDay.length ? data.totalRevenue / data.salesByDay.length : 0), color: A },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>{row.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ INVENTORY REPORT ════════════ */}
      {tab === "inventory" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <KpiCard label="Total Products"    value={data.totalProducts.toString()}   icon={Package}    iconBg="#dbeafe" iconClr={B}       sub="registered items" />
            <KpiCard label="Total Stock Value" value={peso(data.totalStockValue)}       icon={DollarSign} iconBg="#dcfce7" iconClr={G}       sub="current inventory" />
            <KpiCard label="Low Stock Items"   value={data.lowStockCount.toString()}    icon={RefreshCw}  iconBg="#ffedd5" iconClr="#c2410c" sub={data.lowStockCount > 0 ? "need restocking" : "all stocked"} />
            <KpiCard label="Near Expiry"       value={data.nearExpiryCount.toString()}  icon={Calendar}   iconBg="#fef3c7" iconClr={A}       sub="within 7 days" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* By category bar */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Stock by Category</span>
              </div>
              <ChartWrap>
                {data.inventoryByCategory.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.inventoryByCategory}
                      margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip {...TT} formatter={(v: number, n: string) => [
                        n === "value" ? peso(v) : v, n === "value" ? "Value" : "Products"]} />
                      <Legend wrapperStyle={{ fontSize: 11.5 }} />
                      <Bar dataKey="count" name="Products" fill={B}   radius={[4,4,0,0]} maxBarSize={26} />
                      <Bar dataKey="value" name="Value (₱)" fill={G}  radius={[4,4,0,0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartWrap>
            </div>

            {/* Status pie */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Stock Status Distribution</span>
              </div>
              <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                {data.stockStatus.length === 0 ? <Empty /> : (
                  <>
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie data={data.stockStatus} dataKey="count" nameKey="status"
                          cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3}>
                          {data.stockStatus.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...TT} formatter={(v: number, n: string) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                      {data.stockStatus.map((s, i) => {
                        const clr = PIE_COLORS[i % PIE_COLORS.length];
                        const bgMap: Record<string,string> = {
                          NORMAL:"#dcfce7", LOW:"#ffedd5", NEAR_EXPIRY:"#fef3c7", EXPIRED:"#fee2e2" };
                        return (
                          <div key={s.status} style={{ display: "flex", alignItems: "center",
                            justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 2,
                                background: clr, flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, color: "#374151", fontWeight: 500 }}>
                                {s.status.replace("_", " ")}
                              </span>
                            </div>
                            <span style={{ fontSize: 12.5, fontWeight: 700,
                              background: bgMap[s.status] ?? "#f1f5f9",
                              padding: "2px 8px", borderRadius: 99, color: clr }}>
                              {s.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Value table */}
          <div style={card}>
            <div style={cardHdr()}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Inventory Value by Category</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "DM Sans, sans-serif" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["CATEGORY", "PRODUCTS", "STOCK VALUE", "% OF TOTAL"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5,
                        fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as any,
                        color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.inventoryByCategory.map((row, i) => {
                    const pct = data.totalStockValue > 0
                      ? Math.round(row.value / data.totalStockValue * 100) : 0;
                    return (
                      <tr key={row.category}>
                        <td style={{ padding: "11px 16px", fontSize: 13.5, fontWeight: 600,
                          color: "#0f172a", borderBottom: "1px solid #f8fafc" }}>{row.category}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13.5, color: "#475569",
                          borderBottom: "1px solid #f8fafc" }}>{row.count}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13.5, fontWeight: 700,
                          color: G, borderBottom: "1px solid #f8fafc" }}>{peso(row.value)}</td>
                        <td style={{ padding: "11px 16px", borderBottom: "1px solid #f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: "#f1f5f9",
                              borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", borderRadius: 3,
                                background: PIE_COLORS[i % PIE_COLORS.length],
                                width: `${pct}%` }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569",
                              minWidth: 32, textAlign: "right" }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ PROFIT REPORT ════════════ */}
      {tab === "profit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <KpiCard label="Total Revenue"  value={peso(data.totalRevenue)} icon={DollarSign} iconBg="#dcfce7" iconClr={G}
              trend={{ pct: 12, dir: "up" }} />
            <KpiCard label="Gross Profit"   value={peso(data.grossProfit)}  icon={TrendingUp} iconBg="#f3e8ff" iconClr={P}
              sub="estimated (30% margin)" />
            <KpiCard label="Total Profit"   value={peso(data.totalProfit)}  icon={BarChart2}  iconBg="#dbeafe" iconClr={B}
              sub="after cost of goods" />
            <KpiCard label="Profit Margin"  value={`${data.profitMargin.toFixed(1)}%`} icon={Activity} iconBg="#fef3c7" iconClr={A}
              sub="gross margin rate"
              trend={{ pct: data.profitMargin > 30 ? 2 : 1, dir: data.profitMargin >= 25 ? "up" : "down" }} />
          </div>

          {/* Grouped bar */}
          <div style={card}>
            <div style={cardHdr()}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                Revenue vs Cost vs Profit (Monthly)
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                <LegendDot color={G} label="Revenue" />
                <LegendDot color={R} label="Cost"    />
                <LegendDot color={B} label="Profit"  />
              </div>
            </div>
            <ChartWrap>
              {data.profitByMonth.length === 0
                ? <Empty msg="No monthly profit data yet" />
                : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.profitByMonth} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                      tickFormatter={shortPeso} width={60} />
                    <Tooltip {...TT}
                      formatter={(v: number, n: string) => [peso(v), (n as string).charAt(0).toUpperCase()+(n as string).slice(1)]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" fill={G} radius={[4,4,0,0]} maxBarSize={26} />
                    <Bar dataKey="cost"    name="Cost"    fill={R} radius={[4,4,0,0]} maxBarSize={26} />
                    <Bar dataKey="profit"  name="Profit"  fill={B} radius={[4,4,0,0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartWrap>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Profit line */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Profit Trend</span>
              </div>
              <ChartWrap>
                {data.profitByMonth.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.profitByMonth} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                        tickFormatter={shortPeso} width={60} />
                      <Tooltip {...TT} formatter={(v: number) => [peso(v), "Profit"]} />
                      <Line type="monotone" dataKey="profit" stroke={B} strokeWidth={2.5}
                        dot={{ fill: B, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartWrap>
            </div>

            {/* Breakdown table */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Monthly Breakdown</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse",
                  fontFamily: "DM Sans, sans-serif" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["MONTH","REVENUE","COST","PROFIT","MARGIN"].map(h => (
                        <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10.5,
                          fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as any,
                          color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.profitByMonth.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "28px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                        No data yet
                      </td></tr>
                    ) : data.profitByMonth.map(row => {
                      const m = row.revenue > 0 ? row.profit / row.revenue * 100 : 0;
                      return (
                        <tr key={row.month}>
                          <td style={{ padding:"9px 14px", fontSize:13, fontWeight:600, color:"#0f172a", borderBottom:"1px solid #f8fafc" }}>{row.month}</td>
                          <td style={{ padding:"9px 14px", fontSize:13, color:G,          fontWeight:600, borderBottom:"1px solid #f8fafc" }}>{peso(row.revenue)}</td>
                          <td style={{ padding:"9px 14px", fontSize:13, color:R,          fontWeight:600, borderBottom:"1px solid #f8fafc" }}>{peso(row.cost)}</td>
                          <td style={{ padding:"9px 14px", fontSize:13, color:B,          fontWeight:700, borderBottom:"1px solid #f8fafc" }}>{peso(row.profit)}</td>
                          <td style={{ padding:"9px 14px", fontSize:12, fontWeight:600, borderBottom:"1px solid #f8fafc",
                            color: m >= 30 ? "#15803d" : m >= 20 ? A : R }}>
                            {m.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ PRODUCT MOVEMENT ════════════ */}
      {tab === "movement" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stock movement area */}
          <div style={card}>
            <div style={cardHdr()}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                Stock In vs Stock Out Over Time
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                <LegendDot color={G} label="Stock In"  />
                <LegendDot color={R} label="Stock Out" />
              </div>
            </div>
            <ChartWrap>
              {data.movementsByType.length === 0
                ? <Empty msg="No movement data yet — record stock changes in Stock Monitoring." />
                : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.movementsByType} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="inG"  x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={G} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={G} stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={R} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={R} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip {...TT}
                      formatter={(v: number, n: string) => [
                        `${v} units`, n === "stockIn" ? "Stock In" : "Stock Out",
                      ]} />
                    <Area type="monotone" dataKey="stockIn"  stroke={G} strokeWidth={2} fill="url(#inG)"  />
                    <Area type="monotone" dataKey="stockOut" stroke={R} strokeWidth={2} fill="url(#outG)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartWrap>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Top selling */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                  🔥 Fast-Moving Products
                </span>
              </div>
              {data.topSelling.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  No sales data yet
                </div>
              ) : data.topSelling.map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 20px", borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#dcfce7",
                    color: "#15803d", fontSize: 11, fontWeight: 800, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{p.category}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: G }}>{p.sold} sold</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{peso(p.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slow moving */}
            <div style={card}>
              <div style={cardHdr()}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                  🐌 Slow-Moving Products
                </span>
              </div>
              {data.slowMoving.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  No data yet
                </div>
              ) : data.slowMoving.map((p, i) => (
                <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 20px", borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#ffedd5",
                    color: "#c2410c", fontSize: 11, fontWeight: 800, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>{i+1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{p.category}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#c2410c" }}>{p.sold} sold</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{p.stock} in stock</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal sales velocity bar */}
          <div style={card}>
            <div style={cardHdr()}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                Sales Velocity by Product
              </span>
            </div>
            <ChartWrap>
              {data.topSelling.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={Math.max(200, data.topSelling.length * 44)}>
                  <BarChart data={data.topSelling} layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={140}
                      tick={{ fontSize: 11.5, fill: "#374151" }} axisLine={false} tickLine={false} />
                    <Tooltip {...TT} formatter={(v: number) => [v + " units", "Sold"]} />
                    <Bar dataKey="sold" name="Units Sold" fill={G} radius={[0,4,4,0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartWrap>
          </div>
        </div>
      )}
    </div>
  );
}

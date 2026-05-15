import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StaffAlertsClient } from "@/components/staff/staff-alerts-client";
import type { StaffAlert } from "@/components/staff/staff-alerts-client";

// ─── Static fallback ──────────────────────────────────────────────────────────
const now = new Date();
const dAgo = (n: number) =>
  new Date(now.getTime() - n * 86_400_000).toISOString();

const FALLBACK: StaffAlert[] = [
  {
    id: "a1", type: "LOW_STOCK", productId: "p2",
    productName: "White Bread",
    detail: "Low Stock – 34 remaining (min: 15)",
    isResolved: false, resolvedAt: null,
    createdAt: dAgo(1),
    dateLabel: "Yesterday",
  },
  {
    id: "a2", type: "LOW_STOCK", productId: "p10",
    productName: "Orange Juice 1L",
    detail: "Low Stock – 18 remaining (min: 20)",
    isResolved: false, resolvedAt: null,
    createdAt: dAgo(2),
    dateLabel: "2 days ago",
  },
  {
    id: "a3", type: "NEAR_EXPIRY", productId: "p1",
    productName: "Fresh Milk 1L",
    detail: "Expires in 5 days",
    isResolved: false, resolvedAt: null,
    createdAt: dAgo(1),
    dateLabel: "Yesterday",
  },
  {
    id: "a4", type: "NEAR_EXPIRY", productId: "p2",
    productName: "White Bread",
    detail: "Expires in 4 days",
    isResolved: false, resolvedAt: null,
    createdAt: dAgo(1),
    dateLabel: "Yesterday",
  },
  {
    id: "a5", type: "EXPIRED", productId: "p0",
    productName: "Salted Crackers",
    detail: "Product has expired",
    isResolved: false, resolvedAt: null,
    createdAt: dAgo(3),
    dateLabel: "3 days ago",
  },
];

// ─── Helper: build detail string ──────────────────────────────────────────────

function buildDetail(
  type:    string,
  product: { name: string; currentStock: number; lowStockThreshold: number; expirationDate: Date | null } | null,
  message: string
): string {
  if (!product) return message;

  if (type === "LOW_STOCK") {
    return `Low Stock – ${product.currentStock} remaining (min: ${product.lowStockThreshold})`;
  }
  if ((type === "NEAR_EXPIRY" || type === "EXPIRED") && product.expirationDate) {
    const days = Math.ceil(
      (product.expirationDate.getTime() - Date.now()) / 86_400_000
    );
    if (days <= 0) return "Product has expired";
    return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
  }
  return message;
}

function relativeDate(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return `${diff} days ago`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StaffAlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let alerts: StaffAlert[] = FALLBACK;

  try {
    // Auto-detect: create missing alerts for LOW/NEAR_EXPIRY/EXPIRED products
    const urgentProducts = await prisma.product.findMany({
      where: { status: { in: ["LOW", "NEAR_EXPIRY", "EXPIRED"] } },
    });

    for (const p of urgentProducts) {
      const alertType =
        p.status === "LOW"         ? "LOW_STOCK"   :
        p.status === "NEAR_EXPIRY" ? "NEAR_EXPIRY" : "EXPIRED";

      const existing = await prisma.alert.findFirst({
        where: { productId: p.id, type: alertType, isResolved: false },
      });

      if (!existing) {
        let msg = "";
        if (p.status === "LOW") {
          msg = `${p.name} – Low Stock (${p.currentStock} remaining)`;
        } else if (p.expirationDate) {
          const d = Math.ceil((p.expirationDate.getTime() - Date.now()) / 86_400_000);
          msg = d <= 0
            ? `${p.name} – Product has expired`
            : `${p.name} – Expires in ${d} day${d !== 1 ? "s" : ""}`;
        } else {
          msg = `${p.name} – ${p.status}`;
        }
        await prisma.alert.create({
          data: { type: alertType, productId: p.id, message: msg },
        });
      }
    }

    // Fetch all alerts newest-first, active first
    const dbAlerts = await prisma.alert.findMany({
      orderBy: [{ isResolved: "asc" }, { createdAt: "desc" }],
      take: 60,
    });

    // Join product info
    const productIds = [...new Set(dbAlerts.map(a => a.productId))];
    const products   = await prisma.product.findMany({
      where:  { id: { in: productIds } },
      select: {
        id: true, name: true,
        currentStock: true, lowStockThreshold: true, expirationDate: true,
      },
    });
    const pMap = Object.fromEntries(products.map(p => [p.id, p]));

    alerts = dbAlerts.map((a): StaffAlert => {
      const product = pMap[a.productId] ?? null;
      return {
        id:          a.id,
        type:        a.type,
        productId:   a.productId,
        productName: product?.name ?? a.message.split(" –")[0],
        detail:      buildDetail(a.type, product, a.message),
        isResolved:  a.isResolved,
        resolvedAt:  a.resolvedAt?.toISOString() ?? null,
        createdAt:   a.createdAt.toISOString(),
        dateLabel:   relativeDate(a.createdAt),
      };
    });
  } catch (e) {
    console.error("StaffAlertsPage error:", e);
  }

  const totalActive = alerts.filter(a => !a.isResolved).length;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 960, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.03em", margin: "0 0 4px",
        }}>
          Alerts
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          {totalActive > 0
            ? `${totalActive} active alert${totalActive !== 1 ? "s" : ""} need your attention`
            : "All clear — no active alerts!"}
        </p>
      </div>

      <StaffAlertsClient alerts={alerts} totalActive={totalActive} />
    </div>
  );
}
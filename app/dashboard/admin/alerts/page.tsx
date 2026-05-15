import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { AlertsClient } from "../../../../components/alerts/alerts-client";
import type { AlertItem } from "../../../../components/alerts/alerts-client";

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let alerts:      AlertItem[] = [];
  let totalActive: number      = 0;

  try {
    // ── Fetch all alerts newest first, active first ───────────────────────
    const dbAlerts = await prisma.alert.findMany({
      orderBy: [
        { isResolved: "asc"  },   // active first
        { createdAt:  "desc" },   // newest first
      ],
      take: 100,
    });

    // ── Get product names for each alert ──────────────────────────────────
    const productIds = [...new Set(dbAlerts.map((a) => a.productId))];
    const products   = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id:                true,
        name:              true,
        currentStock:      true,
        lowStockThreshold: true,
        expirationDate:    true,
        status:            true,
      },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    alerts = dbAlerts.map((a) => {
      const product = productMap[a.productId] ?? null;

      // Build a readable detail string
      let detail = a.message;
      if (product) {
        if (a.type === "LOW_STOCK") {
          detail = `Low Stock – ${product.currentStock} remaining (threshold: ${product.lowStockThreshold})`;
        } else if (a.type === "NEAR_EXPIRY" && product.expirationDate) {
          const daysLeft = Math.ceil(
            (product.expirationDate.getTime() - Date.now()) / 86_400_000
          );
          detail = daysLeft <= 0
            ? "Product has expired"
            : `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
        } else if (a.type === "EXPIRED") {
          detail = "Product has expired";
        }
      }

      return {
        id:          a.id,
        type:        a.type,
        productId:   a.productId,
        productName: product?.name ?? a.message.split(" –")[0],
        detail,
        message:     a.message,
        isResolved:  a.isResolved,
        resolvedAt:  a.resolvedAt?.toISOString() ?? null,
        createdAt:   a.createdAt.toISOString(),
        dateLabel:   a.createdAt.toLocaleDateString("en-PH", {
          month: "short",
          day:   "numeric",
        }),
      };
    });

    totalActive = alerts.filter((a) => !a.isResolved).length;

  } catch (e) {
    console.error("Alerts page error:", e);
  }

  return (
    <AlertsClient
      alerts={alerts}
      totalActive={totalActive}
    />
  );
}
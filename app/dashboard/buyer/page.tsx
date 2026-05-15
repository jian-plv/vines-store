import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Package, ShoppingBag, Tag } from "lucide-react";
import { BuyerHomeClient } from "../../../components/buyer/buyer-home-client";

export default async function BuyerHomePage() {
  const session = await getServerSession(authOptions);

  let totalProducts   = 0;
  let inStockCount    = 0;
  let discountedCount = 0;

  try {
    const products = await prisma.product.findMany({
      select: { currentStock: true, isDiscounted: true },
    });
    totalProducts   = products.length;
    inStockCount    = products.filter((p) => p.currentStock > 0).length;
    discountedCount = products.filter((p) => p.isDiscounted).length;
  } catch {
    // DB offline — use zeros
  }

  const stats = [
    {
      label:   "Total Products",
      value:   totalProducts.toString(),
      sub:     "items in store",
      iconBg:  "#dbeafe",
      iconClr: "#2563eb",
      icon:    "package",
    },
    {
      label:   "In Stock",
      value:   inStockCount.toString(),
      sub:     "available now",
      iconBg:  "#dcfce7",
      iconClr: "#16a34a",
      icon:    "bag",
    },
    {
      label:   "On Discount",
      value:   discountedCount.toString(),
      sub:     "sale items",
      iconBg:  "#fef3c7",
      iconClr: "#d97706",
      icon:    "tag",
    },
  ];

  return (
    <div style={{ padding: 24 }}>

      {/* Welcome banner — no mouse events, safe in server component */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #3b82f6 100%)",
        borderRadius: 14,
        padding: "28px 32px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(29,78,216,0.22)",
      }}>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: "#fff",
            letterSpacing: "-0.02em", marginBottom: 6,
          }}>
            Welcome, {session?.user?.name ?? "Customer"} 👋
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.78)" }}>
            Browse our fresh grocery products below.
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: 10, padding: "8px 18px",
          fontSize: 13, fontWeight: 700, color: "#fff",
          backdropFilter: "blur(8px)",
        }}>
          Customer Portal
        </div>
      </div>

      {/* Stat cards — no mouse events, safe in server component */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        marginBottom: 28,
      }}>
        {stats.map((card) => (
          <div key={card.label} style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: card.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              {card.icon === "package" && <Package size={20} color={card.iconClr} strokeWidth={2} />}
              {card.icon === "bag"     && <ShoppingBag size={20} color={card.iconClr} strokeWidth={2} />}
              {card.icon === "tag"     && <Tag size={20} color={card.iconClr} strokeWidth={2} />}
            </div>
            <div style={{
              fontSize: 26, fontWeight: 800, color: "#0f172a",
              letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 5,
            }}>
              {card.value}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 2 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Interactive parts — Client Component handles mouse events */}
      <BuyerHomeClient />

    </div>
  );
}
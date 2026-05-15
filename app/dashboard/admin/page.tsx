import { prisma } from "../../../lib/prisma";
import { DashboardSummaryCards } from "../../../components/dashboard/summary-cards";
import { ProductMovementPanels } from "../../../components/dashboard/product-movement-panels";
import type { ProductMovementRow } from "../../../components/dashboard/product-movement-panels";

// ─── Static fallback data (used when DB is not yet connected) ─────────────────
const FALLBACK_FAST: ProductMovementRow[] = [
  { id:"1", name:"Fresh Milk 1L",   category:"Dairy",       soldQty:142, currentStock:58,  price:"85.00" },
  { id:"2", name:"White Bread",     category:"Bakery",      soldQty:98,  currentStock:34,  price:"42.00" },
  { id:"3", name:"Eggs (12pcs)",    category:"Poultry",     soldQty:87,  currentStock:72,  price:"130.00"},
  { id:"4", name:"Rice 5kg",        category:"Grains",      soldQty:76,  currentStock:120, price:"265.00"},
  { id:"5", name:"Cooking Oil 1L",  category:"Condiments",  soldQty:65,  currentStock:44,  price:"78.00" },
];
const FALLBACK_SLOW: ProductMovementRow[] = [
  { id:"6", name:"Sardines (Large)",    category:"Canned Goods", soldQty:4,  currentStock:85, price:"28.00" },
  { id:"7", name:"Instant Coffee 200g", category:"Beverages",    soldQty:6,  currentStock:80, price:"95.00" },
  { id:"8", name:"Vinegar 350ml",       category:"Condiments",   soldQty:3,  currentStock:40, price:"18.00" },
];

export default async function AdminDashboardPage() {
  // ── Try DB queries; fall back to static data if DB is unavailable ─────────
  let totalProducts   = 12;
  let totalStockValue = 0;
  let lowStockCount   = 2;
  let nearExpiryCount = 1;
  let fastMoving:  ProductMovementRow[] = FALLBACK_FAST;
  let slowMoving:  ProductMovementRow[] = FALLBACK_SLOW;

  try {
    // ── Summary counts ───────────────────────────────────────────────────────
    const [allProducts, productStats] = await Promise.all([
      prisma.product.findMany({ include: { category: true } }),
      prisma.product.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    totalProducts = allProducts.length;

    // Calculate real stock value: sum(price × currentStock) for all products
    totalStockValue = allProducts.reduce(
      (sum, p) => sum + Number(p.price) * p.currentStock,
      0
    );

    const statusMap = Object.fromEntries(
      productStats.map((s) => [s.status, s._count.status])
    );
    lowStockCount   = statusMap["LOW"]         ?? 0;
    nearExpiryCount = (statusMap["NEAR_EXPIRY"] ?? 0) + (statusMap["EXPIRED"] ?? 0);

    // ── Fast / slow-moving via SaleItem aggregation ───────────────────────────
    const salesByProduct = await prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
    });

    if (salesByProduct.length > 0) {
      const allIds   = salesByProduct.map((s) => s.productId);
      const prodMap  = Object.fromEntries(
        allProducts.map((p) => [p.id, p])
      );

      const toRow = (s: typeof salesByProduct[0]): ProductMovementRow | null => {
        const p = prodMap[s.productId];
        if (!p) return null;
        return {
          id:           p.id,
          name:         p.name,
          category:     p.category.name,
          soldQty:      s._sum.quantity ?? 0,
          currentStock: p.currentStock,
          price:        p.price.toString(),
        };
      };

      fastMoving = salesByProduct.slice(0, 5).map(toRow).filter(Boolean) as ProductMovementRow[];
      slowMoving = salesByProduct.slice(-3).reverse().map(toRow).filter(Boolean) as ProductMovementRow[];
    }
  } catch {
    // DB not available — static data already set above
  }

  return (
    <div style={{ padding: 24 }} className="fade-in">
      {/* ── Summary Cards ── */}
      <DashboardSummaryCards
        totalProducts={totalProducts}
        totalStockValue={totalStockValue}
        lowStockCount={lowStockCount}
        nearExpiryCount={nearExpiryCount}
      />

      {/* ── Product Movement Tables ── */}
      <ProductMovementPanels
        fastMoving={fastMoving}
        slowMoving={slowMoving}
      />
    </div>
  );
}

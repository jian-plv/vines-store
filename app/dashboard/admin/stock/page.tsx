import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { StockMonitoringClient } from "../../../../components/stock/stock-monitoring-client";
import type { StockProduct, StockMovement } from "../../../../components/stock/stock-monitoring-client";

// ─── Static fallback products (matches seed data) ─────────────────────────────
const FALLBACK_PRODUCTS: StockProduct[] = [
  { id:"p1", name:"Fresh Milk 1L",       currentStock:58,  lowStockThreshold:20, status:"NEAR_EXPIRY", category:{ name:"Dairy"       } },
  { id:"p2", name:"White Bread",         currentStock:34,  lowStockThreshold:15, status:"LOW",         category:{ name:"Bakery"      } },
  { id:"p3", name:"Eggs (12pcs)",        currentStock:72,  lowStockThreshold:24, status:"NORMAL",      category:{ name:"Poultry"     } },
  { id:"p4", name:"Rice 5kg",            currentStock:120, lowStockThreshold:30, status:"NORMAL",      category:{ name:"Grains"      } },
  { id:"p5", name:"Cooking Oil 1L",      currentStock:44,  lowStockThreshold:15, status:"NORMAL",      category:{ name:"Condiments"  } },
  { id:"p6", name:"Sardines (Large)",    currentStock:85,  lowStockThreshold:20, status:"NORMAL",      category:{ name:"Canned Goods"} },
  { id:"p7", name:"Instant Coffee 200g", currentStock:80,  lowStockThreshold:10, status:"NORMAL",      category:{ name:"Beverages"   } },
  { id:"p8", name:"Vinegar 350ml",       currentStock:40,  lowStockThreshold:10, status:"NORMAL",      category:{ name:"Condiments"  } },
];

// ─── Static fallback movements (matches seed data) ────────────────────────────
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

const FALLBACK_MOVEMENTS: StockMovement[] = [
  {
    id:"m1", type:"IN",  productId:"p4", quantity:50, reason:"Delivery from supplier",
    userId:"u1", createdAt: daysAgo(3),
    product:{ id:"p4", name:"Rice 5kg",         currentStock:120, category:{ name:"Grains"       } },
    user:   { id:"u1", name:"Store Owner", role:"ADMIN" },
  },
  {
    id:"m2", type:"OUT", productId:"p2", quantity:12, reason:"Expired – Disposed",
    userId:"u2", createdAt: daysAgo(3),
    product:{ id:"p2", name:"White Bread",       currentStock:34,  category:{ name:"Bakery"       } },
    user:   { id:"u2", name:"Store Staff",  role:"STAFF" },
  },
  {
    id:"m3", type:"IN",  productId:"p1", quantity:30, reason:"Restocking",
    userId:"u1", createdAt: daysAgo(4),
    product:{ id:"p1", name:"Fresh Milk 1L",     currentStock:58,  category:{ name:"Dairy"        } },
    user:   { id:"u1", name:"Store Owner", role:"ADMIN" },
  },
  {
    id:"m4", type:"OUT", productId:"p6", quantity:6,  reason:"Damaged goods",
    userId:"u2", createdAt: daysAgo(4),
    product:{ id:"p6", name:"Sardines (Large)",  currentStock:85,  category:{ name:"Canned Goods" } },
    user:   { id:"u2", name:"Store Staff",  role:"STAFF" },
  },
  {
    id:"m5", type:"IN",  productId:"p5", quantity:24, reason:"Supplier delivery",
    userId:"u1", createdAt: daysAgo(5),
    product:{ id:"p5", name:"Cooking Oil 1L",    currentStock:44,  category:{ name:"Condiments"   } },
    user:   { id:"u1", name:"Store Owner", role:"ADMIN" },
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StockMonitoringPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let products:  StockProduct[]  = FALLBACK_PRODUCTS;
  let movements: StockMovement[] = FALLBACK_MOVEMENTS;
  let userId = "fallback-user-id";

  try {
    // Resolve the real user ID from DB
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    if (dbUser) userId = dbUser.id;

    const [dbProducts, dbMovements] = await Promise.all([
      prisma.product.findMany({
        orderBy: { name: "asc" },
        include: { category: true },
      }),
      prisma.stockMovement.findMany({
        take:    50,
        orderBy: { createdAt: "desc" },
        include: {
          product: { include: { category: true } },
          user:    true,
        },
      }),
    ]);

    products = dbProducts.map((p) => ({
      id:                p.id,
      name:              p.name,
      currentStock:      p.currentStock,
      lowStockThreshold: p.lowStockThreshold,
      status:            p.status,
      category:          { name: p.category.name },
    }));

    movements = dbMovements.map((m) => ({
      id:        m.id,
      type:      m.type,
      productId: m.productId,
      quantity:  m.quantity,
      reason:    m.reason,
      userId:    m.userId,
      createdAt: m.createdAt.toISOString(),
      product: {
        id:           m.product.id,
        name:         m.product.name,
        currentStock: m.product.currentStock,
        category:     { name: m.product.category.name },
      },
      user: {
        id:   m.user.id,
        name: m.user.name,
        role: m.user.role,
      },
    }));
  } catch {
    // DB offline — static fallback already set
  }

  return (
    <StockMonitoringClient
      products={products}
      movements={movements}
      userId={userId}
    />
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { StaffStockClient } from "../../../../components/staff/staff-stock-client";
import type { StaffStockProduct, StaffStockMovement } from "../../../../components/staff/staff-stock-client";

// ─── Static fallback data ─────────────────────────────────────────────────────
const FALLBACK_PRODUCTS: StaffStockProduct[] = [
  { id:"p1",  name:"Fresh Milk 1L",       category:"Dairy",        currentStock:58,  lowStockThreshold:20, status:"NEAR_EXPIRY" },
  { id:"p2",  name:"White Bread",         category:"Bakery",       currentStock:34,  lowStockThreshold:15, status:"LOW"         },
  { id:"p3",  name:"Eggs (12pcs)",        category:"Poultry",      currentStock:72,  lowStockThreshold:24, status:"NORMAL"      },
  { id:"p4",  name:"Rice 5kg",            category:"Grains",       currentStock:120, lowStockThreshold:30, status:"NORMAL"      },
  { id:"p5",  name:"Cooking Oil 1L",      category:"Condiments",   currentStock:44,  lowStockThreshold:15, status:"NORMAL"      },
  { id:"p6",  name:"Sardines (Large)",    category:"Canned Goods", currentStock:85,  lowStockThreshold:20, status:"NORMAL"      },
  { id:"p7",  name:"Instant Coffee 200g", category:"Beverages",    currentStock:80,  lowStockThreshold:10, status:"NORMAL"      },
  { id:"p8",  name:"Vinegar 350ml",       category:"Condiments",   currentStock:40,  lowStockThreshold:10, status:"NORMAL"      },
  { id:"p9",  name:"Cheese 165g",         category:"Dairy",        currentStock:32,  lowStockThreshold:12, status:"NORMAL"      },
  { id:"p10", name:"Orange Juice 1L",     category:"Beverages",    currentStock:18,  lowStockThreshold:20, status:"LOW"         },
];

const now = new Date();
const dAgo = (n: number) =>
  new Date(now.getTime() - n * 86_400_000).toISOString();

const FALLBACK_MOVEMENTS: StaffStockMovement[] = [
  { id:"m1", type:"IN",  productName:"Rice 5kg",         quantity:50, reason:"Delivery from supplier", userName:"Store Owner", createdAt:dAgo(1) },
  { id:"m2", type:"OUT", productName:"White Bread",      quantity:12, reason:"Expired – Disposed",     userName:"Store Staff", createdAt:dAgo(2) },
  { id:"m3", type:"IN",  productName:"Fresh Milk 1L",    quantity:30, reason:"Restocking",             userName:"Store Owner", createdAt:dAgo(2) },
  { id:"m4", type:"OUT", productName:"Sardines (Large)", quantity:6,  reason:"Damaged goods",          userName:"Store Staff", createdAt:dAgo(3) },
  { id:"m5", type:"IN",  productName:"Cooking Oil 1L",   quantity:24, reason:"Delivery from supplier", userName:"Store Owner", createdAt:dAgo(4) },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StaffStockPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let products:  StaffStockProduct[]  = FALLBACK_PRODUCTS;
  let movements: StaffStockMovement[] = FALLBACK_MOVEMENTS;
  let userId = "fallback-user-id";

  try {
    // Resolve real user ID
    const dbUser = await prisma.user.findUnique({
      where:  { email: session.user.email! },
      select: { id: true },
    });
    if (dbUser) userId = dbUser.id;

    const [dbProducts, dbMovements] = await Promise.all([
      prisma.product.findMany({
        orderBy: { name: "asc" },
        select: {
          id:                true,
          name:              true,
          currentStock:      true,
          lowStockThreshold: true,
          status:            true,
          category:          { select: { name: true } },
        },
      }),
      prisma.stockMovement.findMany({
        take:    15,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true } },
          user:    { select: { name: true } },
        },
      }),
    ]);

    if (dbProducts.length > 0) {
      products = dbProducts.map((p) => ({
        id:                p.id,
        name:              p.name,
        category:          p.category.name,
        currentStock:      p.currentStock,
        lowStockThreshold: p.lowStockThreshold,
        status:            p.status as string,
      }));
    }

    if (dbMovements.length > 0) {
      movements = dbMovements.map((m) => ({
        id:          m.id,
        type:        m.type,
        productName: m.product.name,
        quantity:    m.quantity,
        reason:      m.reason ?? "",
        userName:    m.user.name,
        createdAt:   m.createdAt.toISOString(),
      }));
    }
  } catch (e) {
    console.error("StaffStockPage error:", e);
  }

  return (
    <StaffStockClient
      products={products}
      movements={movements}
      userId={userId}
      staffName={session.user.name ?? "Staff"}
    />
  );
}
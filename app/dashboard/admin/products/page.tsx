import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { ProductManagementClient } from "../../../../components/products/product-management-client";
import type { SerializedProduct } from "../../../../components/products/product-management-client";

// ─── Static fallback (matches PDF + seed data) ────────────────────────────────
const FALLBACK_CATEGORIES = [
  { id: "cat-1", name: "Dairy",       createdAt: new Date().toISOString() },
  { id: "cat-2", name: "Bakery",      createdAt: new Date().toISOString() },
  { id: "cat-3", name: "Poultry",     createdAt: new Date().toISOString() },
  { id: "cat-4", name: "Grains",      createdAt: new Date().toISOString() },
  { id: "cat-5", name: "Condiments",  createdAt: new Date().toISOString() },
  { id: "cat-6", name: "Beverages",   createdAt: new Date().toISOString() },
  { id: "cat-7", name: "Canned Goods",createdAt: new Date().toISOString() },
  { id: "cat-8", name: "Personal Care",createdAt: new Date().toISOString() },
];

function makeProduct(
  id: string, name: string, catId: string, catName: string,
  price: string, stock: number, threshold: number,
  expDate: string | null, status: string
): SerializedProduct {
  return {
    id, name,
    categoryId: catId,
    category: { id: catId, name: catName, createdAt: new Date() as any },
    price, currentStock: stock, lowStockThreshold: threshold,
    expirationDate: expDate, status,
    barcode: name, shelfLocation: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const FALLBACK_PRODUCTS: SerializedProduct[] = [
  makeProduct("p1","Fresh Milk 1L",   "cat-1","Dairy",       "85.00",  58,  20, "2026-03-06T00:00:00Z", "NEAR_EXPIRY"),
  makeProduct("p2","White Bread",     "cat-2","Bakery",      "42.00",  12,  15, "2026-03-05T00:00:00Z", "LOW"),
  makeProduct("p3","Eggs (12pcs)",    "cat-3","Poultry",     "130.00", 72,  24, "2026-03-15T00:00:00Z", "NORMAL"),
  makeProduct("p4","Rice 5kg",        "cat-4","Grains",      "265.00", 120, 30, "2026-12-01T00:00:00Z", "NORMAL"),
  makeProduct("p5","Cooking Oil 1L",  "cat-5","Condiments",  "78.00",  44,  15, "2026-08-20T00:00:00Z", "NORMAL"),
  makeProduct("p6","Sardines (Large)","cat-7","Canned Goods","28.00",  85,  20, null,                    "NORMAL"),
  makeProduct("p7","Instant Coffee 200g","cat-6","Beverages","95.00",  80,  10, null,                    "NORMAL"),
  makeProduct("p8","Vinegar 350ml",   "cat-5","Condiments",  "18.00",  40,  10, null,                    "NORMAL"),
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Try DB; fall back silently
  let products:   SerializedProduct[] = FALLBACK_PRODUCTS;
  let categories: any[]               = FALLBACK_CATEGORIES;

  try {
    const [dbProducts, dbCategories] = await Promise.all([
      prisma.product.findMany({
        include:  { category: true },
        orderBy:  { createdAt: "desc" },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    products = dbProducts.map((p) => ({
      ...p,
      price:          p.price.toString(),
      expirationDate: p.expirationDate?.toISOString() ?? null,
      createdAt:      p.createdAt.toISOString(),
      updatedAt:      p.updatedAt.toISOString(),
      imageUrl:       p.imageUrl ?? null,
      category: {
        ...p.category,
        createdAt: p.category.createdAt,
      },
    }));

    categories = dbCategories;
  } catch {
    // DB offline — static data is already set
  }

  return (
    <ProductManagementClient
      products={products}
      categories={categories}
    />
  );
}

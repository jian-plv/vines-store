import { prisma } from "@/lib/prisma";
import { BuyerProductCatalog } from "@/components/buyer/buyer-product-catalog";
import type { BuyerProduct } from "@/components/buyer/buyer-product-catalog";

// ─── Typed fallback ───────────────────────────────────────────────────────────
const FALLBACK: BuyerProduct[] = [
  { id:"p1", name:"Fresh Milk 1L",       category:"Dairy",        price:"85.00",  currentStock:58,  status:"NEAR_EXPIRY", imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
  { id:"p2", name:"White Bread",         category:"Bakery",       price:"42.00",  currentStock:34,  status:"LOW",         imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
  { id:"p3", name:"Eggs (12pcs)",        category:"Poultry",      price:"130.00", currentStock:72,  status:"NORMAL",      imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
  { id:"p4", name:"Rice 5kg",            category:"Grains",       price:"265.00", currentStock:120, status:"NORMAL",      imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
  { id:"p5", name:"Cooking Oil 1L",      category:"Condiments",   price:"78.00",  currentStock:44,  status:"NORMAL",      imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
  { id:"p6", name:"Sardines (Large)",    category:"Canned Goods", price:"28.00",  currentStock:85,  status:"NORMAL",      imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
  { id:"p7", name:"Instant Coffee 200g", category:"Beverages",    price:"95.00",  currentStock:80,  status:"NORMAL",      imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
  { id:"p8", name:"Vinegar 350ml",       category:"Condiments",   price:"18.00",  currentStock:40,  status:"NORMAL",      imageUrl:null, isDiscounted:false, originalPrice:null, discountPercent:null },
];

export default async function BuyerProductsPage() {
  let products: BuyerProduct[] = FALLBACK;

  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { category: true },
    });

    if (dbProducts.length > 0) {
      products = dbProducts.map((p): BuyerProduct => ({
        id:              p.id,
        name:            p.name,
        category:        p.category?.name ?? "Uncategorized",
        price:           p.price.toString(),
        currentStock:    p.currentStock,
        status:          p.status as string,
        imageUrl:        (p as any).imageUrl        ?? null,
        isDiscounted:    (p as any).isDiscounted    ?? false,
        originalPrice:   (p as any).originalPrice   ? (p as any).originalPrice.toString() : null,
        discountPercent: (p as any).discountPercent ?? null,
      }));
    }
  } catch (e) {
    console.error("BuyerProductsPage error:", e);
  }

  return <BuyerProductCatalog products={products} />;
}
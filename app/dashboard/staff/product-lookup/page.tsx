import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { ProductLookupClient } from "../../../../components/staff/product-lookup-client";
import type { LookupProduct } from "../../../../components/staff/product-lookup-client";

// ─── Static fallback — sorted alphabetically ──────────────────────────────────
const FALLBACK: LookupProduct[] = [
  { id:"p12", name:"Canned Tuna",         category:"Canned Goods", price:"32.00",  currentStock:90,  lowStockThreshold:15, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 5 – Canned",      barcode:"Canned Tuna"         },
  { id:"p9",  name:"Cheese 165g",         category:"Dairy",        price:"78.00",  currentStock:32,  lowStockThreshold:12, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 1 – Dairy",       barcode:"Cheese 165g"         },
  { id:"p5",  name:"Cooking Oil 1L",      category:"Condiments",   price:"78.00",  currentStock:44,  lowStockThreshold:15, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 4 – Condiments",  barcode:"Cooking Oil 1L"      },
  { id:"p3",  name:"Eggs (12pcs)",        category:"Poultry",      price:"130.00", currentStock:72,  lowStockThreshold:24, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 1 – Poultry",     barcode:"Eggs (12pcs)"        },
  { id:"p1",  name:"Fresh Milk 1L",       category:"Dairy",        price:"85.00",  currentStock:58,  lowStockThreshold:20, status:"NEAR_EXPIRY", imageUrl:null, shelfLocation:"Aisle 1 – Dairy",       barcode:"Fresh Milk 1L"       },
  { id:"p7",  name:"Instant Coffee 200g", category:"Beverages",    price:"95.00",  currentStock:80,  lowStockThreshold:10, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 4 – Beverages",   barcode:"Instant Coffee 200g" },
  { id:"p10", name:"Orange Juice 1L",     category:"Beverages",    price:"75.00",  currentStock:18,  lowStockThreshold:20, status:"LOW",         imageUrl:null, shelfLocation:"Aisle 4 – Beverages",   barcode:"Orange Juice 1L"     },
  { id:"p4",  name:"Rice 5kg",            category:"Grains",       price:"265.00", currentStock:120, lowStockThreshold:30, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 3 – Grains",      barcode:"Rice 5kg"            },
  { id:"p6",  name:"Sardines (Large)",    category:"Canned Goods", price:"28.00",  currentStock:85,  lowStockThreshold:20, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 5 – Canned",      barcode:"Sardines (Large)"    },
  { id:"p11", name:"Soy Sauce 1L",        category:"Condiments",   price:"45.00",  currentStock:55,  lowStockThreshold:10, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 4 – Condiments",  barcode:"Soy Sauce 1L"        },
  { id:"p8",  name:"Vinegar 350ml",       category:"Condiments",   price:"18.00",  currentStock:40,  lowStockThreshold:10, status:"NORMAL",      imageUrl:null, shelfLocation:"Aisle 4 – Condiments",  barcode:"Vinegar 350ml"       },
  { id:"p2",  name:"White Bread",         category:"Bakery",       price:"42.00",  currentStock:34,  lowStockThreshold:15, status:"LOW",         imageUrl:null, shelfLocation:"Aisle 2 – Bakery",      barcode:"White Bread"         },
];

export default async function ProductLookupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let products: LookupProduct[] = FALLBACK;

  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { category: true },   // ← use include not select so price is available
    });

    if (dbProducts.length > 0) {
      products = dbProducts.map((p): LookupProduct => ({
        id:                p.id,
        name:              p.name,
        category:          p.category?.name ?? "Uncategorized",
        price:             p.price.toString(),        // ← works because price is included
        currentStock:      p.currentStock,
        lowStockThreshold: p.lowStockThreshold,
        status:            p.status as string,
        imageUrl:          (p as any).imageUrl    ?? null,
        shelfLocation:     p.shelfLocation        ?? null,
        barcode:           p.barcode              ?? null,
      }));
    }
  } catch (e) {
    console.error("ProductLookupPage error:", e);
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontSize: 20, fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.03em", margin: "0 0 4px",
        }}>
          Product Lookup
        </h1>
        <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
          Search products by name, category, or barcode · {products.length} products loaded
        </p>
      </div>

      <ProductLookupClient products={products} />
    </div>
  );
}
// lib/pos-data.ts
// Shared data loader used by both admin and staff POS pages.

import { prisma } from "@/lib/prisma";
import type { POSProduct } from "@/components/pos/pos-client";

const FALLBACK: POSProduct[] = [
  { id:"p1", name:"Fresh Milk 1L",       category:"Dairy",       price:"85.00",  currentStock:58,  status:"NEAR_EXPIRY" },
  { id:"p2", name:"White Bread",         category:"Bakery",      price:"42.00",  currentStock:34,  status:"LOW"         },
  { id:"p3", name:"Eggs (12pcs)",        category:"Poultry",     price:"130.00", currentStock:72,  status:"NORMAL"      },
  { id:"p4", name:"Rice 5kg",            category:"Grains",      price:"265.00", currentStock:120, status:"NORMAL"      },
  { id:"p5", name:"Cooking Oil 1L",      category:"Condiments",  price:"78.00",  currentStock:44,  status:"NORMAL"      },
  { id:"p6", name:"Sardines (Large)",    category:"Canned Goods",price:"28.00",  currentStock:85,  status:"NORMAL"      },
  { id:"p7", name:"Instant Coffee 200g", category:"Beverages",   price:"95.00",  currentStock:80,  status:"NORMAL"      },
  { id:"p8", name:"Vinegar 350ml",       category:"Condiments",  price:"18.00",  currentStock:40,  status:"NORMAL"      },
  { id:"p9", name:"Cheese 165g",         category:"Dairy",       price:"78.00",  currentStock:32,  status:"NORMAL"      },
  { id:"p10",name:"Orange Juice 1L",     category:"Beverages",   price:"75.00",  currentStock:18,  status:"LOW"         },
  { id:"p11",name:"Soy Sauce 1L",        category:"Condiments",  price:"45.00",  currentStock:55,  status:"NORMAL"      },
  { id:"p12",name:"Canned Tuna",         category:"Canned Goods",price:"32.00",  currentStock:90,  status:"NORMAL"      },
];

export async function loadPOSData(email: string): Promise<{
  products: POSProduct[];
  userId:   string;
}> {
  try {
    const [dbUser, dbProducts] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.product.findMany({
        where:   { currentStock: { gt: 0 } },
        orderBy: { name: "asc" },
        include: { category: true },
      }),
    ]);

    const products: POSProduct[] = dbProducts.map((p) => ({
      id:           p.id,
      name:         p.name,
      category:     p.category.name,
      price:        p.price.toString(),
      currentStock: p.currentStock,
      status:       p.status,
    }));

    return {
      products: products.length > 0 ? products : FALLBACK,
      userId:   dbUser?.id ?? "fallback-user-id",
    };
  } catch {
    return { products: FALLBACK, userId: "fallback-user-id" };
  }
}

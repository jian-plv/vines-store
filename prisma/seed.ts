/**
 * prisma/seed.ts  –  Run with: npm run db:seed
 * Seeds the exact grocery products shown in the PDF screenshots.
 */
import { PrismaClient, Role, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("🌱  Seeding Vine's Store …");

  const catNames = ["Dairy","Bakery","Poultry","Grains","Condiments","Beverages","Canned Goods","Personal Care","Frozen"];
  const cats: Record<string,string> = {};
  for (const name of catNames) {
    const c = await prisma.category.upsert({ where:{name}, update:{}, create:{name} });
    cats[name] = c.id;
  }

  const products = [
    { name:"Fresh Milk 1L",       category:"Dairy",       price:85,   stock:58,  threshold:20, expDays:5,   status:ProductStatus.NEAR_EXPIRY, soldQty:142, shelf:"Aisle 1 – Dairy"      },
    { name:"White Bread",         category:"Bakery",      price:42,   stock:34,  threshold:15, expDays:4,   status:ProductStatus.LOW,         soldQty:98,  shelf:"Aisle 2 – Bakery"     },
    { name:"Eggs (12pcs)",        category:"Poultry",     price:130,  stock:72,  threshold:24, expDays:18,  status:ProductStatus.NORMAL,      soldQty:87,  shelf:"Aisle 1 – Poultry"    },
    { name:"Rice 5kg",            category:"Grains",      price:265,  stock:120, threshold:30, expDays:240, status:ProductStatus.NORMAL,      soldQty:76,  shelf:"Aisle 3 – Grains"     },
    { name:"Cooking Oil 1L",      category:"Condiments",  price:78,   stock:44,  threshold:15, expDays:127, status:ProductStatus.NORMAL,      soldQty:65,  shelf:"Aisle 4 – Condiments" },
    { name:"Sardines (Large)",    category:"Canned Goods",price:28,   stock:85,  threshold:20, expDays:450, status:ProductStatus.NORMAL,      soldQty:4,   shelf:"Aisle 5 – Canned"     },
    { name:"Instant Coffee 200g", category:"Beverages",   price:95,   stock:80,  threshold:10, expDays:290, status:ProductStatus.NORMAL,      soldQty:6,   shelf:"Aisle 4 – Beverages"  },
    { name:"Vinegar 350ml",       category:"Condiments",  price:18,   stock:40,  threshold:10, expDays:365, status:ProductStatus.NORMAL,      soldQty:3,   shelf:"Aisle 4 – Condiments" },
    { name:"Cheese 165g",         category:"Dairy",       price:78,   stock:32,  threshold:12, expDays:21,  status:ProductStatus.NORMAL,      soldQty:45,  shelf:"Aisle 1 – Dairy"      },
    { name:"Orange Juice 1L",     category:"Beverages",   price:75,   stock:18,  threshold:20, expDays:14,  status:ProductStatus.LOW,         soldQty:38,  shelf:"Aisle 4 – Beverages"  },
    { name:"Soy Sauce 1L",        category:"Condiments",  price:45,   stock:55,  threshold:10, expDays:400, status:ProductStatus.NORMAL,      soldQty:22,  shelf:"Aisle 4 – Condiments" },
    { name:"Canned Tuna",         category:"Canned Goods",price:32,   stock:90,  threshold:15, expDays:500, status:ProductStatus.NORMAL,      soldQty:11,  shelf:"Aisle 5 – Canned"     },
  ];

  const ids: Record<string,string> = {};
  for (const p of products) {
    const prod = await prisma.product.upsert({
      where: { barcode: p.name },
      update: { price:p.price, currentStock:p.stock, lowStockThreshold:p.threshold, expirationDate:daysFromNow(p.expDays), status:p.status, categoryId:cats[p.category], shelfLocation:p.shelf },
      create: { name:p.name, barcode:p.name, categoryId:cats[p.category], price:p.price, currentStock:p.stock, lowStockThreshold:p.threshold, expirationDate:daysFromNow(p.expDays), status:p.status, shelfLocation:p.shelf },
    });
    ids[p.name] = prod.id;
    console.log(`   ✓ ${p.name}`);
  }

  await prisma.user.upsert({ where:{email:"admin@vine.com"}, update:{}, create:{ name:"Store Owner", email:"admin@vine.com", password:"password", role:Role.ADMIN } });
  await prisma.user.upsert({ where:{email:"staff@vine.com"}, update:{}, create:{ name:"Store Staff",  email:"staff@vine.com", password:"password", role:Role.STAFF } });

  const admin = await prisma.user.findUnique({ where:{email:"admin@vine.com"} });
  const adminId = admin!.id;

  // Seed sales (so fast/slow-moving queries work)
  for (const p of products) {
    if (p.soldQty === 0) continue;
    const total = p.price * p.soldQty;
    await prisma.sale.create({
      data: {
        totalAmount: total, amountPaid: total, change: 0, userId: adminId,
        createdAt: daysFromNow(-(Math.floor(Math.random()*25)+1)),
        items: { create: { productId:ids[p.name], quantity:p.soldQty, unitPrice:p.price, subtotal:total } },
      },
    });
  }
  console.log("   ✓ Sales seeded");

  // Stock movements (matching PDF table)
  const staff = await prisma.user.findUnique({ where:{email:"staff@vine.com"} });
  const staffId = staff!.id;
  const movements = [
    { name:"Rice 5kg",          type:"IN"  as const, qty:50, reason:"Delivery from supplier", by:adminId, ago:3 },
    { name:"White Bread",       type:"OUT" as const, qty:12, reason:"Expired – Disposed",      by:staffId, ago:3 },
    { name:"Fresh Milk 1L",     type:"IN"  as const, qty:30, reason:"Restocking",              by:adminId, ago:4 },
    { name:"Sardines (Large)",  type:"OUT" as const, qty:6,  reason:"Damaged goods",           by:staffId, ago:4 },
    { name:"Cooking Oil 1L",    type:"IN"  as const, qty:24, reason:"Supplier delivery",       by:adminId, ago:5 },
  ];
  for (const m of movements) {
    await prisma.stockMovement.create({
      data: { type:m.type, productId:ids[m.name], quantity:m.qty, reason:m.reason, userId:m.by, createdAt:daysFromNow(-m.ago) },
    });
  }
  console.log("   ✓ Stock movements seeded");

  // Alerts
  await prisma.alert.deleteMany({ where:{isResolved:false} });
  await prisma.alert.createMany({ data:[
    { type:"LOW_STOCK",   productId:ids["White Bread"],       message:"White Bread – Low Stock (34 remaining)",    isResolved:false },
    { type:"LOW_STOCK",   productId:ids["Orange Juice 1L"],  message:"Orange Juice 1L – Low Stock (18 remaining)", isResolved:false },
    { type:"NEAR_EXPIRY", productId:ids["Fresh Milk 1L"],    message:"Fresh Milk 1L – Expires in 5 days",          isResolved:false },
  ]});
  console.log("   ✓ Alerts seeded");
  console.log("\n✅  Done!  admin@vine.com / password   |   staff@vine.com / password");
}

main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());

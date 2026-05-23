import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding Vine's Store …");

  // ── Create users with hashed passwords ──────────────────────────────────
  const adminPassword = await bcrypt.hash("VineAdmin2024!", 12);
  const staffPassword = await bcrypt.hash("VineStaff2024!", 12);
  const buyerPassword = await bcrypt.hash("vinestoreBuyer", 12);

  const admin = await prisma.user.upsert({
    where:  { email: "admin@vine.com" },
    update: { hashedPassword: adminPassword, name: "Store Owner", role: "ADMIN" },
    create: {
      name:           "Store Owner",
      email:          "admin@vine.com",
      hashedPassword: adminPassword,
      role:           "ADMIN",
    },
  });

  const staff = await prisma.user.upsert({
    where:  { email: "staff@vine.com" },
    update: { hashedPassword: staffPassword, name: "Store Staff", role: "STAFF" },
    create: {
      name:           "Store Staff",
      email:          "staff@vine.com",
      hashedPassword: staffPassword,
      role:           "STAFF",
    },
  });

  const buyer = await prisma.user.upsert({
    where:  { email: "buyer@vine.com" },
    update: { hashedPassword: buyerPassword, name: "Customer", role: "BUYER" },
    create: {
      name:           "Customer",
      email:          "buyer@vine.com",
      hashedPassword: buyerPassword,
      role:           "BUYER",
    },
  });

  console.log("   ✓ Admin:  admin@vine.com  / VineAdmin2024!");
  console.log("   ✓ Staff:  staff@vine.com  / VineStaff2024!");
  console.log("   ✓ Buyer:  buyer@vine.com  / vinestoreBuyer");

  // ── Categories ────────────────────────────────────────────────────────────
  const categoryNames = [
    "Dairy", "Bakery", "Poultry", "Grains",
    "Condiments", "Beverages", "Canned Goods",
    "Personal Care", "Frozen",
  ];

  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where:  { name },
      update: {},
      create: { name },
    });
    categories[name] = cat.id;
    console.log(`   ✓ Category: ${name}`);
  }

  // ── Products ──────────────────────────────────────────────────────────────
  const products = [
    { name:"Canned Tuna",         categoryName:"Canned Goods", price:32.00,  stock:90,  threshold:15 },
    { name:"Cheese 165g",         categoryName:"Dairy",        price:78.00,  stock:32,  threshold:12 },
    { name:"Cooking Oil 1L",      categoryName:"Condiments",   price:78.00,  stock:44,  threshold:15 },
    { name:"Eggs (12pcs)",        categoryName:"Poultry",      price:130.00, stock:72,  threshold:24 },
    { name:"Fresh Milk 1L",       categoryName:"Dairy",        price:85.00,  stock:58,  threshold:20 },
    { name:"Instant Coffee 200g", categoryName:"Beverages",    price:95.00,  stock:80,  threshold:10 },
    { name:"Orange Juice 1L",     categoryName:"Beverages",    price:75.00,  stock:18,  threshold:20 },
    { name:"Rice 5kg",            categoryName:"Grains",       price:265.00, stock:120, threshold:30 },
    { name:"Sardines (Large)",    categoryName:"Canned Goods", price:28.00,  stock:85,  threshold:20 },
    { name:"Soy Sauce 1L",        categoryName:"Condiments",   price:45.00,  stock:55,  threshold:10 },
    { name:"Vinegar 350ml",       categoryName:"Condiments",   price:18.00,  stock:40,  threshold:10 },
    { name:"White Bread",         categoryName:"Bakery",       price:42.00,  stock:34,  threshold:15 },
  ];

  for (const p of products) {
    const barcode = `${p.name.toUpperCase().replace(/\s+/g, "-")}-${Date.now()}`;
    await prisma.product.upsert({
      where:  { barcode },
      update: {},
      create: {
        name:              p.name,
        categoryId:        categories[p.categoryName],
        price:             p.price,
        currentStock:      p.stock,
        lowStockThreshold: p.threshold,
        status:            p.stock <= p.threshold ? "LOW" : "NORMAL",
        barcode,
      },
    });
    console.log(`   ✓ ${p.name}`);
  }

  // ── Sample sales ──────────────────────────────────────────────────────────
  console.log("   ✓ Seed complete!");
  console.log("\n✅  Done!");
  console.log("   admin@vine.com  / VineAdmin2024!");
  console.log("   staff@vine.com  / VineStaff2024!");
  console.log("   buyer@vine.com  / vinestoreBuyer");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
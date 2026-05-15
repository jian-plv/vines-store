"use server";

import { prisma } from "../prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";
import type { ProductStatus } from "@prisma/client";

function computeStatus(
  currentStock: number,
  lowStockThreshold: number,
  expirationDate: Date | null
): ProductStatus {
  if (expirationDate) {
    const daysLeft = Math.ceil((expirationDate.getTime() - Date.now()) / 86_400_000);
    if (daysLeft <= 0) return "EXPIRED";
    if (daysLeft <= 7) return "NEAR_EXPIRY";
  }
  if (currentStock <= lowStockThreshold) return "LOW";
  return "NORMAL";
}

function serialize(p: any) {
  return {
    ...p,
    price:          p.price.toString(),
    expirationDate: p.expirationDate?.toISOString() ?? null,
    createdAt:      p.createdAt.toISOString(),
    updatedAt:      p.updatedAt.toISOString(),
    category: p.category ? {
      ...p.category,
      createdAt: p.category.createdAt?.toISOString?.() ?? p.category.createdAt,
    } : p.category,
  };
}

function revalidateAll() {
  revalidatePath("/dashboard/admin/products");
  revalidatePath("/dashboard/admin");
}

export async function addProduct(payload: {
  name: string; categoryId: string; price: number;
  currentStock: number; lowStockThreshold: number;
  expirationDate: string | null; shelfLocation: string | null;
  imageUrl:          string | null;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  if (!payload.name.trim()) throw new Error("Product name is required.");
  if (!payload.categoryId)  throw new Error("Category is required.");
  if (isNaN(payload.price) || payload.price < 0) throw new Error("Valid price is required.");

  const expDate = payload.expirationDate ? new Date(payload.expirationDate) : null;
  const status  = computeStatus(payload.currentStock, payload.lowStockThreshold, expDate);
  const barcode = `${payload.name.trim().toUpperCase().replace(/\s+/g, "-")}-${Date.now()}`;

  const product = await prisma.product.create({
    data: {
      name: payload.name.trim(), barcode,
      categoryId: payload.categoryId,
      price: payload.price,
      currentStock: payload.currentStock,
      lowStockThreshold: payload.lowStockThreshold,
      expirationDate: expDate,
      shelfLocation: payload.shelfLocation ?? null,
      imageUrl:          payload.imageUrl ?? null,
      status,
      
    },
    include: { category: true },
  });

  if (["LOW","NEAR_EXPIRY","EXPIRED"].includes(status)) {
    const typeMap: Record<string,string> = { LOW:"LOW_STOCK", NEAR_EXPIRY:"NEAR_EXPIRY", EXPIRED:"EXPIRED" };
    await prisma.alert.create({ data: {
      type: typeMap[status], productId: product.id,
      message: status === "LOW"
        ? `${product.name} – Low Stock (${product.currentStock} remaining)`
        : `${product.name} – ${status === "EXPIRED" ? "Expired" : "Expires soon"} (${expDate?.toLocaleDateString("en-PH")})`,
    }});
  }

  revalidateAll();
  return serialize(product);
}

export async function updateProduct(id: string, payload: {
  name: string; categoryId: string; price: number;
  currentStock: number; lowStockThreshold: number;
  expirationDate: string | null; shelfLocation: string | null;
  imageUrl:          string | null;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  if (!payload.name.trim()) throw new Error("Product name is required.");
  if (!payload.categoryId)  throw new Error("Category is required.");

  const expDate = payload.expirationDate ? new Date(payload.expirationDate) : null;
  const status  = computeStatus(payload.currentStock, payload.lowStockThreshold, expDate);

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: payload.name.trim(), categoryId: payload.categoryId,
      price: payload.price, currentStock: payload.currentStock,
      lowStockThreshold: payload.lowStockThreshold,
      expirationDate: expDate, shelfLocation: payload.shelfLocation ?? null,
      imageUrl:          payload.imageUrl ?? null,
       status,
    },
    include: { category: true },
  });

  await prisma.alert.updateMany({
    where: { productId: id, isResolved: false },
    data:  { isResolved: true, resolvedAt: new Date() },
  });

  if (["LOW","NEAR_EXPIRY","EXPIRED"].includes(status)) {
    const typeMap: Record<string,string> = { LOW:"LOW_STOCK", NEAR_EXPIRY:"NEAR_EXPIRY", EXPIRED:"EXPIRED" };
    await prisma.alert.create({ data: {
      type: typeMap[status], productId: id,
      message: status === "LOW"
        ? `${product.name} – Low Stock (${product.currentStock} remaining)`
        : `${product.name} – ${status === "EXPIRED" ? "Expired" : "Expires soon"} (${expDate?.toLocaleDateString("en-PH")})`,
    }});
  }

  revalidateAll();
  return serialize(product);
}

export async function deleteProduct(id: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.$transaction([
    prisma.alert.deleteMany(            { where: { productId: id } }),
    prisma.stockMovement.deleteMany(    { where: { productId: id } }),
    prisma.purchaseOrderItem.deleteMany({ where: { productId: id } }),
    prisma.saleItem.deleteMany(         { where: { productId: id } }),
    prisma.product.delete(              { where: { id } }),
  ]);

  revalidateAll();
}

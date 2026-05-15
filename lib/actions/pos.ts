"use server";

import { prisma } from "../prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";
import type { ProductStatus } from "@prisma/client";

function computeStatus(
  stock: number,
  threshold: number,
  expiry: Date | null
): ProductStatus {
  if (expiry) {
    const d = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
    if (d <= 0) return "EXPIRED";
    if (d <= 7)  return "NEAR_EXPIRY";
  }
  if (stock <= threshold) return "LOW";
  return "NORMAL";
}

function revalidateAll() {
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/pos");
  revalidatePath("/dashboard/admin/stock");
  revalidatePath("/dashboard/admin/products");
  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/dashboard/staff/pos");
}

export async function processSale(data: {
  items:       { productId: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  amountPaid:  number;
  change:      number;
  userId:      string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  if (!data.items.length)      throw new Error("Cart is empty.");
  if (data.amountPaid < data.totalAmount)
    throw new Error("Payment amount is less than the total.");

  // ── Pre-validate all stock levels before touching DB ────────────────────
  for (const item of data.items) {
    const p = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!p)                         throw new Error(`Product not found.`);
    if (p.currentStock < item.quantity)
      throw new Error(`"${p.name}" only has ${p.currentStock} unit${p.currentStock !== 1 ? "s" : ""} left.`);
  }

  // ── Single transaction: create sale + deduct stock + movements + alerts ──
  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        totalAmount: data.totalAmount,
        amountPaid:  data.amountPaid,
        change:      data.change,
        userId:      data.userId,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity:  i.quantity,
            unitPrice: i.unitPrice,
            subtotal:  Math.round(i.unitPrice * i.quantity * 100) / 100,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const newStock  = product.currentStock - item.quantity;
      const newStatus = computeStatus(newStock, product.lowStockThreshold, product.expirationDate);

      await tx.product.update({
        where: { id: item.productId },
        data:  { currentStock: newStock, status: newStatus },
      });

      await tx.stockMovement.create({
        data: {
          type:      "OUT",
          productId: item.productId,
          quantity:  item.quantity,
          reason:    "Sold",
          userId:    data.userId,
        },
      });

      if (newStatus === "LOW") {
        const existing = await tx.alert.findFirst({
          where: { productId: item.productId, type: "LOW_STOCK", isResolved: false },
        });
        if (!existing) {
          await tx.alert.create({
            data: {
              type:      "LOW_STOCK",
              productId: item.productId,
              message:   `${product.name} – Low Stock (${newStock} remaining)`,
            },
          });
        }
      }
    }

    return sale;
  });

  revalidateAll();

  return {
    id:            sale.id,
    receiptNumber: sale.receiptNumber,
    total:         Number(sale.totalAmount),
    amountPaid:    Number(sale.amountPaid),
    change:        Number(sale.change),
    createdAt:     sale.createdAt.toISOString(),
    items: sale.items.map((i) => ({
      name:      i.product.name,
      quantity:  i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
  };
}

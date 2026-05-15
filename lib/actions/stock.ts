"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ProductStatus } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStatus(
  currentStock: number,
  lowStockThreshold: number,
  expirationDate: Date | null
): ProductStatus {
  if (expirationDate) {
    const daysLeft = Math.ceil(
      (expirationDate.getTime() - Date.now()) / 86_400_000
    );
    if (daysLeft <= 0) return "EXPIRED";
    if (daysLeft <= 7) return "NEAR_EXPIRY";
  }
  if (currentStock <= lowStockThreshold) return "LOW";
  return "NORMAL";
}

function revalidateAll() {
  revalidatePath("/dashboard/admin/stock");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/products");
}

// ─── Record a stock movement ──────────────────────────────────────────────────

export async function recordStockMovement(data: {
  type:      "IN" | "OUT";
  productId: string;
  quantity:  number;
  reason:    string | null;
  userId:    string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  if (!data.productId)        throw new Error("Please select a product.");
  if (data.quantity < 1)      throw new Error("Quantity must be at least 1.");

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });
  if (!product) throw new Error("Product not found.");

  if (data.type === "OUT" && product.currentStock < data.quantity) {
    throw new Error(
      `Cannot remove ${data.quantity} unit${data.quantity !== 1 ? "s" : ""} — only ${product.currentStock} in stock.`
    );
  }

  const newStock =
    data.type === "IN"
      ? product.currentStock + data.quantity
      : product.currentStock - data.quantity;

  const newStatus = computeStatus(
    newStock,
    product.lowStockThreshold,
    product.expirationDate
  );

  // Atomic: create movement + update product in one transaction
  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        type:      data.type,
        productId: data.productId,
        quantity:  data.quantity,
        reason:    data.reason,
        userId:    data.userId,
      },
      include: {
        product: { include: { category: true } },
        user:    true,
      },
    }),
    prisma.product.update({
      where: { id: data.productId },
      data:  { currentStock: newStock, status: newStatus },
    }),
  ]);

  // ── Auto-alert for low stock ──────────────────────────────────────────────
  if (newStatus === "LOW") {
    const existing = await prisma.alert.findFirst({
      where: { productId: data.productId, type: "LOW_STOCK", isResolved: false },
    });
    if (!existing) {
      await prisma.alert.create({
        data: {
          type:      "LOW_STOCK",
          productId: data.productId,
          message:   `${product.name} – Low Stock (${newStock} remaining)`,
        },
      });
    }
  }

  // ── Auto-resolve low-stock alert if stock is back up ─────────────────────
  if (data.type === "IN" && newStatus !== "LOW") {
    await prisma.alert.updateMany({
      where: { productId: data.productId, type: "LOW_STOCK", isResolved: false },
      data:  { isResolved: true, resolvedAt: new Date() },
    });
  }

  revalidateAll();

  return {
    newStock,
    newStatus,
    movement: serializeMovement(movement),
  };
}

// ─── Serialise Prisma movement for client components ─────────────────────────

function serializeMovement(m: any) {
  return {
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
  };
}

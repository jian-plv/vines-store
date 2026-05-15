"use server";

import { prisma } from "../prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";

function revalidateAll() {
  revalidatePath("/dashboard/admin/alerts");
  revalidatePath("/dashboard/admin/products");
  revalidatePath("/dashboard/admin");
}

// ─── Mark alert as resolved ───────────────────────────────────────────────────
export async function resolveAlert(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  await prisma.alert.update({
    where: { id },
    data:  { isResolved: true, resolvedAt: new Date() },
  });

  revalidateAll();
}

// ─── Reorder ──────────────────────────────────────────────────────────────────
export async function reorderProduct(alertId: string, productId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  await prisma.alert.update({
    where: { id: alertId },
    data:  { isResolved: true, resolvedAt: new Date() },
  });

  revalidateAll();
}

// ─── Apply Real 50% Discount ──────────────────────────────────────────────────
export async function applyDiscount(
  alertId:        string,
  discountPercent: number = 50
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Get the alert to find the productId
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
  });
  if (!alert) throw new Error("Alert not found.");

  // Get the product
  const product = await prisma.product.findUnique({
    where: { id: alert.productId },
  });
  if (!product) throw new Error("Product not found.");

  // If already discounted, don't discount again
  if (product.isDiscounted) {
    throw new Error(`${product.name} already has a discount applied.`);
  }

  // Calculate new discounted price
  const originalPrice   = Number(product.price);
  const discountedPrice = originalPrice * (1 - discountPercent / 100);
  const roundedPrice    = Math.round(discountedPrice * 100) / 100;

  // Update product price + mark as discounted
  await prisma.product.update({
    where: { id: alert.productId },
    data: {
      price:           roundedPrice,
      originalPrice:   originalPrice,
      discountPercent: discountPercent,
      isDiscounted:    true,
    },
  });

  // Resolve the alert
  await prisma.alert.update({
    where: { id: alertId },
    data:  { isResolved: true, resolvedAt: new Date() },
  });

  revalidateAll();

  return {
    productName:    product.name,
    originalPrice,
    discountedPrice: roundedPrice,
    discountPercent,
  };
}

// ─── Remove Discount ──────────────────────────────────────────────────────────
export async function removeDiscount(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product || !product.isDiscounted) {
    throw new Error("Product has no active discount.");
  }

  // Restore original price
  await prisma.product.update({
    where: { id: productId },
    data: {
      price:           product.originalPrice ?? product.price,
      originalPrice:   null,
      discountPercent: null,
      isDiscounted:    false,
    },
  });

  revalidateAll();
}

// ─── Auto-detect alerts ───────────────────────────────────────────────────────
export async function autoDetectAlerts() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const products = await prisma.product.findMany({
    where: { status: { in: ["LOW", "NEAR_EXPIRY", "EXPIRED"] } },
  });

  let created = 0;

  for (const product of products) {
    const alertType =
      product.status === "LOW"         ? "LOW_STOCK"   :
      product.status === "NEAR_EXPIRY" ? "NEAR_EXPIRY" : "EXPIRED";

    const existing = await prisma.alert.findFirst({
      where: { productId: product.id, type: alertType, isResolved: false },
    });

    if (!existing) {
      let message = "";
      if (product.status === "LOW") {
        message = `${product.name} – Low Stock (${product.currentStock} remaining)`;
      } else if (product.expirationDate) {
        const daysLeft = Math.ceil(
          (product.expirationDate.getTime() - Date.now()) / 86_400_000
        );
        message = daysLeft <= 0
          ? `${product.name} – Product has expired`
          : `${product.name} – Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
      } else {
        message = `${product.name} – Status: ${product.status}`;
      }

      await prisma.alert.create({
        data: { type: alertType, productId: product.id, message },
      });
      created++;
    }
  }

  revalidateAll();
  return { created };
}
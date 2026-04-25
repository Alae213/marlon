import { MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export function toDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toOrderDigest(order: Doc<"orders">) {
  const firstProduct = order.products[0];
  return {
    orderId: order._id,
    storeId: order.storeId,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerWilaya: order.customerWilaya,
    status: order.status,
    paymentStatus: order.paymentStatus,
    codPaymentStatus: order.codPaymentStatus,
    total: order.total,
    subtotal: order.subtotal,
    deliveryCost: order.deliveryCost,
    deliveryProvider: order.deliveryProvider,
    trackingNumber: order.trackingNumber,
    riskFlags: order.riskFlags,
    productsCount: order.products.length,
    primaryProductName: firstProduct?.name,
    primaryProductImage: firstProduct?.image,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toProductDigest(product: Doc<"products">) {
  return {
    productId: product._id,
    storeId: product.storeId,
    name: product.name,
    basePrice: product.basePrice,
    oldPrice: product.oldPrice,
    primaryImage: product.images?.[0],
    category: product.category,
    isArchived: product.isArchived ?? false,
    sortOrder: product.sortOrder,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function upsertOrderDigest(ctx: MutationCtx, order: Doc<"orders">) {
  const existing = await ctx.db
    .query("orderDigests")
    .withIndex("orderId", (q) => q.eq("orderId", order._id))
    .first();

  const nextDigest = toOrderDigest(order);
  if (existing) {
    await ctx.db.patch(existing._id, nextDigest);
    return existing._id;
  }

  return await ctx.db.insert("orderDigests", nextDigest);
}

export async function upsertProductDigest(ctx: MutationCtx, product: Doc<"products">) {
  const existing = await ctx.db
    .query("productDigests")
    .withIndex("productId", (q) => q.eq("productId", product._id))
    .first();

  const nextDigest = toProductDigest(product);
  if (existing) {
    await ctx.db.patch(existing._id, nextDigest);
    return existing._id;
  }

  return await ctx.db.insert("productDigests", nextDigest);
}

export async function deleteProductDigest(ctx: MutationCtx, productId: Id<"products">) {
  const existing = await ctx.db
    .query("productDigests")
    .withIndex("productId", (q) => q.eq("productId", productId))
    .first();

  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

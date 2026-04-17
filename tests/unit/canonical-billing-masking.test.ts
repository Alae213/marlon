import { describe, expect, it } from "bun:test";

import {
  maskCustomerData,
} from "@/convex/canonicalBilling";

// Helper to generate Algiers day key (mirrors internal logic)
function getAlgiersDayKey(timestamp: number = Date.now()): string {
  const ALGIERS_OFFSET_MS = 1 * 60 * 60 * 1000;
  const utc = timestamp;
  const algiers = new Date(utc + ALGIERS_OFFSET_MS);
  return `${algiers.getFullYear()}-${String(algiers.getMonth() + 1).padStart(2, "0")}-${String(algiers.getDate()).padStart(2, "0")}`;
}

interface OrderWithCustomer {
  _id: string;
  storeId: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerWilaya?: string;
  customerCommune?: string;
  customerAddress?: string;
  products: Array<{ productId: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  deliveryCost: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: number;
  updatedAt?: number;
  notes?: string;
}

describe("maskCustomerData - masked overflow retention", () => {
  it("masks customer PII fields on order data", () => {
    const order = {
      _id: "order_1",
      storeId: "store_1",
      orderNumber: "ORD-001",
      customerName: "أحمد محمد",
      customerPhone: "+213770000000",
      customerWilaya: "الجزائر",
      customerCommune: "البحري",
      customerAddress: "123 شارع الحرية",
      products: [],
      subtotal: 1000,
      deliveryCost: 500,
      total: 1500,
      status: "new",
      paymentStatus: "pending",
      createdAt: Date.now(),
    };

    const masked = maskCustomerData(order);

    expect(masked.customerName).toBe("معلومات محمية");
    expect(masked.customerPhone).toBe("معلومات محمية");
    expect(masked.customerWilaya).toBe("معلومات محمية");
    expect(masked.customerCommune).toBe("معلومات محمية");
    expect(masked.customerAddress).toBe("معلومات محمية");

    // Non-PII fields remain unchanged
    expect(masked.orderNumber).toBe("ORD-001");
    expect(masked.total).toBe(1500);
    expect(masked.status).toBe("new");
  });

  it("preserves original order object fields not related to customer PII", () => {
    const order = {
      _id: "order_1",
      storeId: "store_1",
      orderNumber: "ORD-002",
      customerName: "سمية",
      customerPhone: "+213661111111",
      customerWilaya: "وهران",
      customerCommune: "عين الترك",
      customerAddress: "شقة 5",
      products: [
        { productId: "p1", name: "Product 1", price: 500, quantity: 2 },
      ],
      subtotal: 1000,
      deliveryCost: 300,
      total: 1300,
      status: "delivered",
      paymentStatus: "paid",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: "هدية",
    };

    const masked = maskCustomerData(order);

    // Verify products are preserved
    expect(masked.products).toEqual([
      { productId: "p1", name: "Product 1", price: 500, quantity: 2 },
    ]);
    expect(masked.notes).toBe("هدية");
    expect(masked.status).toBe("delivered");
    expect(masked.paymentStatus).toBe("paid");
  });

  it("handles order with missing customer fields gracefully", () => {
    const order: OrderWithCustomer = {
      _id: "order_1",
      storeId: "store_1",
      orderNumber: "ORD-003",
      products: [],
      subtotal: 1000,
      deliveryCost: 0,
      total: 1000,
      status: "new",
      paymentStatus: "pending",
      createdAt: Date.now(),
      // No customer fields
    };

    const masked = maskCustomerData(order as any);

    expect(masked.customerName).toBe("معلومات محمية");
    expect(masked.customerPhone).toBe("معلومات محمية");
    // These may be undefined in the original
    expect(masked.customerWilaya).toBe("معلومات محمية");
  });
});

describe("getAlgiersDayKey - timezone handling", () => {
  it("generates correct day key for Algiers timezone", () => {
    // Test with a known timestamp - Jan 15, 2024 12:00 UTC
    // Algeria is UTC+1, so this should be 13:00 local
    const timestamp = Date.parse("2024-01-15T12:00:00Z");
    const dayKey = getAlgiersDayKey(timestamp);

    expect(dayKey).toBe("2024-01-15");
  });

  it("handles midnight UTC crossing into previous day in Algeria", () => {
    // Jan 15, 2024 00:30 UTC = 01:30 Algeria (still Jan 15)
    const timestamp1 = Date.parse("2024-01-15T00:30:00Z");
    expect(getAlgiersDayKey(timestamp1)).toBe("2024-01-15");

    // Dec 31, 2023 23:30 UTC = 00:30 Algeria Jan 1, 2024
    const timestamp2 = Date.parse("2023-12-31T23:30:00Z");
    expect(getAlgiersDayKey(timestamp2)).toBe("2024-01-01");
  });

  it("returns consistent results for same day in Algiers", () => {
    const now = Date.now();
    const key1 = getAlgiersDayKey(now);
    const key2 = getAlgiersDayKey(now + 3600000); // 1 hour later
    const key3 = getAlgiersDayKey(now - 3600000); // 1 hour earlier

    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
  });
});
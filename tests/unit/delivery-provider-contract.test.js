import { afterEach } from "bun:test";

import { runDeliveryProviderContractSuite } from "@/tests/helpers/delivery-provider-contract";
import { YalidineAdapter } from "@/lib/delivery/adapters/yalidine-adapter";
import { ZRExpressAdapter } from "@/lib/delivery/adapters/zr-express-adapter";

const validCredentials = {
  apiKey: "key",
  apiSecret: "secret",
};

const validRequest = {
  storeId: "store_1",
  orderId: "order_1",
  customerName: "Jane Doe",
  customerPhone: "0555000000",
  customerWilaya: "Algiers",
  customerCommune: "Bab Ezzouar",
  customerAddress: "Address",
  products: [{ name: "Product", quantity: 1, price: 1000 }],
  total: 1000,
};

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

runDeliveryProviderContractSuite({
  name: "ZR Express",
  createAdapter: () => new ZRExpressAdapter(),
  validCredentials,
  validRequest,
  trackingNumber: "ZR123",
  mockFetch: (stage) => {
    if (stage === "createOrder") {
      global.fetch = async () =>
        new Response(JSON.stringify({ tracking_number: "ZR123", delivery_fee: 300 }), { status: 200 });
      return;
    }

    global.fetch = async () =>
      new Response(JSON.stringify({ tracking_number: "ZR123", status: "delivered" }), { status: 200 });
  },
});

runDeliveryProviderContractSuite({
  name: "Yalidine",
  createAdapter: () => new YalidineAdapter(),
  validCredentials,
  validRequest,
  trackingNumber: "YA123",
  mockFetch: (stage) => {
    if (stage === "createOrder") {
      global.fetch = async () =>
        new Response(JSON.stringify({ tracking: "YA123", frais_livraison: 250 }), { status: 200 });
      return;
    }

    global.fetch = async () =>
      new Response(JSON.stringify({ tracking: "YA123", statut: "livree" }), { status: 200 });
  },
});

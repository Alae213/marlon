import {
  CreateDeliveryRequest,
  DeliveryCredentials,
  DeliveryProviderAdapter,
  DeliveryResponse,
  DeliveryStatus,
} from "@/lib/delivery/contracts";

const ZR_EXPRESS_API_URL = "https://api.zrexpress.dz/api/v1/orders";

function mapZRStatus(zrStatus: string): DeliveryStatus["status"] {
  const statusMap: Record<string, DeliveryStatus["status"]> = {
    pending: "pending",
    picked_up: "picked_up",
    in_transit: "in_transit",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    returned: "returned",
    failed: "failed",
  };
  return statusMap[zrStatus] || "pending";
}

export class ZRExpressAdapter implements DeliveryProviderAdapter {
  readonly provider = "zr_express" as const;

  async createOrder(
    credentials: DeliveryCredentials,
    request: CreateDeliveryRequest
  ): Promise<DeliveryResponse> {
    try {
      const response = await fetch(ZR_EXPRESS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.apiKey}`,
          "X-API-SECRET": credentials.apiSecret,
        },
        body: JSON.stringify({
          order_number: request.orderId,
          recipient_name: request.customerName,
          recipient_phone: request.customerPhone,
          recipient_wilaya: request.customerWilaya,
          recipient_commune: request.customerCommune,
          recipient_address: request.customerAddress,
          products: request.products,
          cod_amount: request.total,
          account_number: credentials.accountNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to create ZR Express order",
        };
      }

      const data = await response.json();
      return {
        success: true,
        trackingNumber: data.tracking_number,
        deliveryFee: data.delivery_fee,
      };
    } catch (error) {
      console.error("ZR Express API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getStatus(credentials: DeliveryCredentials, trackingNumber: string): Promise<DeliveryStatus | null> {
    try {
      const response = await fetch(`${ZR_EXPRESS_API_URL}/${trackingNumber}`, {
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          "X-API-SECRET": credentials.apiSecret,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        trackingNumber: data.tracking_number,
        status: mapZRStatus(data.status),
        estimatedDelivery: data.estimated_delivery,
        currentLocation: data.current_location,
      };
    } catch (error) {
      console.error("ZR Express status error:", error);
      return null;
    }
  }
}

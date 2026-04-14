import {
  CreateDeliveryRequest,
  DeliveryCredentials,
  DeliveryProviderAdapter,
  DeliveryResponse,
  DeliveryStatus,
} from "@/lib/delivery/contracts";

const YALIDINE_API_URL = "https://api.yalidine.ws/v1/orders";

function mapYalidineStatus(yalidineStatus: string): DeliveryStatus["status"] {
  const statusMap: Record<string, DeliveryStatus["status"]> = {
    en_attente: "pending",
    collectee: "picked_up",
    en_cours: "in_transit",
    en_livraison: "out_for_delivery",
    livree: "delivered",
    retour: "returned",
    echouee: "failed",
  };
  return statusMap[yalidineStatus] || "pending";
}

export class YalidineAdapter implements DeliveryProviderAdapter {
  readonly provider = "yalidine" as const;

  async createOrder(
    credentials: DeliveryCredentials,
    request: CreateDeliveryRequest
  ): Promise<DeliveryResponse> {
    try {
      const response = await fetch(YALIDINE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: credentials.apiKey,
        },
        body: JSON.stringify({
          reference: request.orderId,
          destinataire: {
            nom: request.customerName,
            mobile: request.customerPhone,
            commune: request.customerCommune,
            adresse: request.customerAddress,
            wilaya: request.customerWilaya,
          },
          produits: request.products.map((product) => ({
            designation: product.name,
            qte: product.quantity,
            prix: product.price,
          })),
          frais: request.total,
          api_secret: credentials.apiSecret,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to create Yalidine order",
        };
      }

      const data = await response.json();
      return {
        success: true,
        trackingNumber: data.tracking,
        deliveryFee: data.frais_livraison,
      };
    } catch (error) {
      console.error("Yalidine API error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getStatus(credentials: DeliveryCredentials, trackingNumber: string): Promise<DeliveryStatus | null> {
    try {
      const response = await fetch(`https://api.yalidine.ws/v1/track/${trackingNumber}`, {
        headers: {
          Authorization: credentials.apiKey,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        trackingNumber: data.tracking,
        status: mapYalidineStatus(data.statut),
        estimatedDelivery: data.date_livraison,
        currentLocation: data.position,
      };
    } catch (error) {
      console.error("Yalidine status error:", error);
      return null;
    }
  }
}

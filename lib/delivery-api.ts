export interface DeliveryCredentials {
  apiKey: string;
  apiSecret: string;
  accountNumber?: string;
}

export interface CreateDeliveryRequest {
  storeId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerCommune: string;
  customerAddress: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export interface DeliveryResponse {
  success: boolean;
  trackingNumber?: string;
  deliveryFee?: number;
  error?: string;
}

export interface DeliveryStatus {
  trackingNumber: string;
  status: "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "failed";
  estimatedDelivery?: string;
  currentLocation?: string;
}

// ZR Express API integration
export async function createZRExpressOrder(
  credentials: DeliveryCredentials,
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> {
  const ZR_EXPRESS_API_URL = "https://api.zrexpress.dz/api/v1/orders";
  
  try {
    const response = await fetch(ZR_EXPRESS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${credentials.apiKey}`,
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

export async function getZRExpressStatus(
  credentials: DeliveryCredentials,
  trackingNumber: string
): Promise<DeliveryStatus | null> {
  const ZR_EXPRESS_API_URL = `https://api.zrexpress.dz/api/v1/orders/${trackingNumber}`;
  
  try {
    const response = await fetch(ZR_EXPRESS_API_URL, {
      headers: {
        "Authorization": `Bearer ${credentials.apiKey}`,
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

// Yalidine API integration
export async function createYalidineOrder(
  credentials: DeliveryCredentials,
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> {
  const YALIDINE_API_URL = "https://api.yalidine.ws/v1/orders";
  
  try {
    const response = await fetch(YALIDINE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": credentials.apiKey,
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
        produits: request.products.map(p => ({
          designation: p.name,
          qte: p.quantity,
          prix: p.price,
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

export async function getYalidineStatus(
  credentials: DeliveryCredentials,
  trackingNumber: string
): Promise<DeliveryStatus | null> {
  const YALIDINE_API_URL = `https://api.yalidine.ws/v1/track/${trackingNumber}`;
  
  try {
    const response = await fetch(YALIDINE_API_URL, {
      headers: {
        "Authorization": credentials.apiKey,
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

// Status mapping functions
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

// Unified delivery API
export type DeliveryProvider = "zr_express" | "yalidine";

export async function createDeliveryOrder(
  provider: DeliveryProvider,
  credentials: DeliveryCredentials,
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> {
  switch (provider) {
    case "zr_express":
      return createZRExpressOrder(credentials, request);
    case "yalidine":
      return createYalidineOrder(credentials, request);
    default:
      return {
        success: false,
        error: "Unknown delivery provider",
      };
  }
}

export async function getDeliveryStatus(
  provider: DeliveryProvider,
  credentials: DeliveryCredentials,
  trackingNumber: string
): Promise<DeliveryStatus | null> {
  switch (provider) {
    case "zr_express":
      return getZRExpressStatus(credentials, trackingNumber);
    case "yalidine":
      return getYalidineStatus(credentials, trackingNumber);
    default:
      return null;
  }
}

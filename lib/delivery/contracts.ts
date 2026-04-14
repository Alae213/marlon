export type DeliveryLifecycleStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "failed";

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
  status: DeliveryLifecycleStatus;
  estimatedDelivery?: string;
  currentLocation?: string;
}

export type DeliveryProviderKey = "zr_express" | "yalidine";

export interface DeliveryProviderAdapter {
  readonly provider: DeliveryProviderKey;
  createOrder(
    credentials: DeliveryCredentials,
    request: CreateDeliveryRequest
  ): Promise<DeliveryResponse>;
  getStatus(credentials: DeliveryCredentials, trackingNumber: string): Promise<DeliveryStatus | null>;
}

import { createDefaultDeliveryAdapterRegistry } from "@/lib/delivery/adapter-registry";
import {
  CreateDeliveryRequest,
  DeliveryCredentials,
  DeliveryProviderKey,
  DeliveryResponse,
  DeliveryStatus,
} from "@/lib/delivery/contracts";
import { recommendProvider } from "@/lib/delivery/recommendation-engine";
import { DeliveryService } from "@/lib/delivery/service";
import { toDeliveryApiProvider } from "@/lib/delivery-provider";

const deliveryService = new DeliveryService(createDefaultDeliveryAdapterRegistry());

export type DeliveryProvider = "zr_express" | "zr-express" | "yalidine";

export function getDeliveryService() {
  return deliveryService;
}

export async function createZRExpressOrder(
  credentials: DeliveryCredentials,
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> {
  return deliveryService.createOrder("zr_express", credentials, request);
}

export async function getZRExpressStatus(
  credentials: DeliveryCredentials,
  trackingNumber: string
): Promise<DeliveryStatus | null> {
  return deliveryService.getStatus("zr_express", credentials, trackingNumber);
}

export async function createYalidineOrder(
  credentials: DeliveryCredentials,
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> {
  return deliveryService.createOrder("yalidine", credentials, request);
}

export async function getYalidineStatus(
  credentials: DeliveryCredentials,
  trackingNumber: string
): Promise<DeliveryStatus | null> {
  return deliveryService.getStatus("yalidine", credentials, trackingNumber);
}

export async function createDeliveryOrder(
  provider: DeliveryProvider,
  credentials: DeliveryCredentials,
  request: CreateDeliveryRequest
): Promise<DeliveryResponse> {
  const normalizedProvider = toDeliveryApiProvider(provider);

  if (!normalizedProvider) {
    return {
      success: false,
      error: "Unknown delivery provider",
    };
  }

  return deliveryService.createOrder(normalizedProvider, credentials, request);
}

export async function getDeliveryStatus(
  provider: DeliveryProvider,
  credentials: DeliveryCredentials,
  trackingNumber: string
): Promise<DeliveryStatus | null> {
  const normalizedProvider = toDeliveryApiProvider(provider);

  if (!normalizedProvider) {
    return null;
  }

  return deliveryService.getStatus(normalizedProvider, credentials, trackingNumber);
}

export function getProviderRecommendation(input: {
  mode: "recommendation_only";
  providers: Array<{
    provider: DeliveryProviderKey;
    attempts: number;
    delivered: number;
    failed: number;
    rts: number;
  }>;
  region?: string;
}) {
  return recommendProvider(input);
}

export type {
  CreateDeliveryRequest,
  DeliveryCredentials,
  DeliveryProviderKey,
  DeliveryResponse,
  DeliveryStatus,
};

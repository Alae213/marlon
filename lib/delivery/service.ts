import { DeliveryAdapterRegistry } from "@/lib/delivery/adapter-registry";
import {
  CreateDeliveryRequest,
  DeliveryCredentials,
  DeliveryProviderKey,
  DeliveryResponse,
  DeliveryStatus,
} from "@/lib/delivery/contracts";

export class DeliveryService {
  constructor(private readonly registry: DeliveryAdapterRegistry) {}

  async createOrder(
    provider: DeliveryProviderKey,
    credentials: DeliveryCredentials,
    request: CreateDeliveryRequest
  ): Promise<DeliveryResponse> {
    const adapter = this.registry.get(provider);
    if (!adapter) {
      return {
        success: false,
        error: `Unsupported provider: ${provider}`,
      };
    }

    return adapter.createOrder(credentials, request);
  }

  async getStatus(
    provider: DeliveryProviderKey,
    credentials: DeliveryCredentials,
    trackingNumber: string
  ): Promise<DeliveryStatus | null> {
    const adapter = this.registry.get(provider);
    if (!adapter) {
      return null;
    }

    return adapter.getStatus(credentials, trackingNumber);
  }
}

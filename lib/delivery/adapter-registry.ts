import { YalidineAdapter } from "@/lib/delivery/adapters/yalidine-adapter";
import { ZRExpressAdapter } from "@/lib/delivery/adapters/zr-express-adapter";
import { DeliveryProviderAdapter, DeliveryProviderKey } from "@/lib/delivery/contracts";

export class DeliveryAdapterRegistry {
  private readonly adapters = new Map<DeliveryProviderKey, DeliveryProviderAdapter>();

  register(adapter: DeliveryProviderAdapter) {
    this.adapters.set(adapter.provider, adapter);
  }

  get(provider: DeliveryProviderKey) {
    return this.adapters.get(provider) ?? null;
  }

  listProviders() {
    return Array.from(this.adapters.keys());
  }
}

export function createDefaultDeliveryAdapterRegistry() {
  const registry = new DeliveryAdapterRegistry();
  registry.register(new ZRExpressAdapter());
  registry.register(new YalidineAdapter());
  return registry;
}

/**
 * Format a price in Algerian Dinar (DZD).
 * Shared utility for product display components.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Generate a unique ID for links and other entities.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

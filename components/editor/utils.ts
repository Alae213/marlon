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

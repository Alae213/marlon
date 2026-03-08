/**
 * Validate Algerian phone number format
 * Valid formats: 05XX XXX XXX or 06XX XXX XXX (10 digits starting with 05 or 06)
 */
export function validateAlgerianPhone(phone: string): { isValid: boolean; error?: string } {
  // Remove any spaces or dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Check if it's empty
  if (!cleaned) {
    return { isValid: false, error: "Phone number is required" };
  }
  
  // Check if it starts with 05 or 06
  if (!/^0[56]/.test(cleaned)) {
    return { isValid: false, error: "Phone must start with 05 or 06" };
  }
  
  // Check if it has exactly 10 digits
  if (!/^0[56]\d{8}$/.test(cleaned)) {
    return { isValid: false, error: "Phone must be 10 digits (e.g., 05XX XXX XXX)" };
  }
  
  return { isValid: true };
}

/**
 * Format phone number for display (add spaces)
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Format phone as user types
 */
export function formatPhoneInput(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format as 05X XXX XXX
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
}

// Payment Service - Generic abstraction for payment providers
// Currently supports: Chargily, SofizPay ( Stellar), or custom implementations
// To add a new provider: implement the PaymentProvider interface and add to providers/

export interface PaymentProvider {
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  verifyWebhook(body: string, signature?: string): Promise<WebhookEvent | null>;
}

export interface CreateCheckoutParams {
  storeId: string;
  storeName: string;
  amount: number; // in centimes/dinars
  currency?: string;
  customerEmail?: string;
  description?: string;
}

export interface CheckoutResult {
  checkoutUrl?: string | null;
  checkoutId?: string;
  success: boolean;
  error?: string;
  message?: string; // For demo mode messages
}

export interface WebhookEvent {
  event: string;
  paymentId: string;
  storeId?: string;
  metadata?: Record<string, unknown>;
  status: "succeeded" | "failed" | "pending";
}

// Provider names
export type PaymentProviderName = "chargily" | "sofizpay" | "custom";

/**
 * Get the active payment provider from environment configuration
 */
export function getActivePaymentProvider(): PaymentProviderName {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase();
  
  if (provider === "sofizpay") return "sofizpay";
  if (provider === "custom") return "custom";
  return "chargily"; // default
}

/**
 * Get the configured payment provider instance
 * This will be used by API routes - simply swap the implementation
 */
export function getPaymentProvider(): PaymentProvider {
  const providerName = getActivePaymentProvider();
  
  switch (providerName) {
    case "sofizpay":
      return new SofizPayProvider();
    case "custom":
      return new CustomPaymentProvider();
    case "chargily":
    default:
      return new ChargilyProvider();
  }
}

// ============================================
// Provider Implementations
// ============================================

/**
 * Chargily Pay Provider
 * Supports EDAHABIA and CIB (SATIM) payment methods in Algeria
 */
class ChargilyProvider implements PaymentProvider {
  private apiUrl = "https://api.chargily.com/dashboard/api/v2/checkouts";
  private apiKey: string | undefined = process.env.CHARGILY_API_KEY;
  private webhookUrl: string | undefined = process.env.CHARGILY_WEBHOOK_URL;
  private returnUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.apiKey) {
      console.warn("Chargily API key not configured, using mock response");
      return {
        success: true,
        checkoutUrl: null,
        message: "Demo mode - payment would be created",
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: params.amount * 100,
              currency: params.currency || "dzd",
              description: params.description || `اشتراك ${params.storeName} - خطة سنوية`,
              webhook_url: this.webhookUrl,
              success_url: `${this.returnUrl}/dashboard?payment=success`,
              failed_url: `${this.returnUrl}/dashboard?payment=failed`,
              customer: {
                name: params.storeName,
                email: params.customerEmail || "customer@example.com",
              },
              metadata: {
                storeId: params.storeId,
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Chargily API error:", error);
        return { success: false, error: "Failed to create payment" };
      }

      const data = await response.json();
      return {
        checkoutUrl: data.data?.attributes?.checkout_url,
        checkoutId: data.data?.id,
        success: true,
      };
    } catch (error) {
      console.error("Chargily checkout error:", error);
      return { success: false, error: "Payment creation failed" };
    }
  }

  verifyWebhook(body: string, signature?: string): Promise<WebhookEvent | null> {
    // Chargily webhook verification would go here
    // For now, parse the body directly
    try {
      const data = JSON.parse(body);
      return Promise.resolve({
        event: data.event,
        paymentId: data.data?.id,
        storeId: data.data?.attributes?.metadata?.storeId,
        status: data.event === "payment.succeeded" ? "succeeded" : "pending",
      });
    } catch {
      return Promise.resolve(null);
    }
  }
}

/**
 * SofizPay Provider (Stellar-based digital payments for Algeria)
 * Supports EDAHABIA and CIB (SATIM) payment methods
 */
class SofizPayProvider implements PaymentProvider {
  private apiKey: string | undefined = process.env.SOFIZPAY_API_KEY;
  private apiUrl: string | undefined = process.env.SOFIZPAY_API_URL;
  
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!this.apiKey || !this.apiUrl) {
      console.warn("SofizPay not configured, using mock response");
      return {
        success: true,
        checkoutUrl: null,
        message: "Demo mode - SofizPay payment would be created",
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency || "DZD",
          description: params.description || `Subscription for ${params.storeName}`,
          store_id: params.storeId,
          customer_email: params.customerEmail,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
          webhook_url: process.env.SOFIZPAY_WEBHOOK_URL,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("SofizPay API error:", error);
        return { success: false, error: "Failed to create SofizPay payment" };
      }

      const data = await response.json();
      return {
        checkoutUrl: data.payment_url || data.checkout_url,
        checkoutId: data.payment_id,
        success: true,
      };
    } catch (error) {
      console.error("SofizPay checkout error:", error);
      return { success: false, error: "Payment creation failed" };
    }
  }

  verifyWebhook(body: string, signature?: string): Promise<WebhookEvent | null> {
    // SofizPay webhook verification with signature
    if (signature && this.apiKey) {
      // Implement proper HMAC verification here
    }

    try {
      const data = JSON.parse(body);
      return Promise.resolve({
        event: data.event || data.type,
        paymentId: data.payment_id || data.id,
        storeId: data.metadata?.storeId || data.store_id,
        status: data.status === "completed" ? "succeeded" : 
                data.status === "failed" ? "failed" : "pending",
      });
    } catch {
      return Promise.resolve(null);
    }
  }
}

/**
 * Custom/Placeholder Provider
 * Use this when implementing your own payment solution
 */
class CustomPaymentProvider implements PaymentProvider {
  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Placeholder - implement your custom payment logic here
    console.log("Custom payment provider - implement your logic");
    
    return {
      success: true,
      checkoutUrl: null,
      message: "Custom payment provider - implementation needed",
    };
  }

  verifyWebhook(body: string, signature?: string): Promise<WebhookEvent | null> {
    // Implement custom webhook verification
    try {
      const data = JSON.parse(body);
      return Promise.resolve({
        event: data.event || data.type,
        paymentId: data.id,
        storeId: data.store_id,
        status: "pending",
      });
    } catch {
      return Promise.resolve(null);
    }
  }
}
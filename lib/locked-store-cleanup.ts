/**
 * Locked Store Order Auto-Deletion Utility
 * 
 * Per PRD §Billing Edge Case 3:
 * - Auto-delete locked store orders after 20 days
 * - Add lockedAt timestamp to stores when they become locked
 * - Run cleanup on order operations
 * 
 * Per PRD §Billing State Machine:
 * - Subscription expiry → revert to free tier (trial)
 * - Trial window: 30 days, max 50 orders before lock
 */

const LOCKED_ORDER_RETENTION_DAYS = 20;
const LOCKED_ORDER_RETENTION_MS = LOCKED_ORDER_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const TRIAL_WINDOW_DAYS = 30;
const TRIAL_WINDOW_MS = TRIAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const MAX_ORDERS_BEFORE_LOCK = 50;

export interface StoreData {
  _id: string;
  name: string;
  slug: string;
  subscription: "trial" | "active" | "locked";
  subscriptionPaidUntil?: number;
  lockedAt?: number;
  firstOrderAt?: number;
  orderCount?: number;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: number;
  [key: string]: unknown;
}

/**
 * Get all stores from localStorage
 */
export function getAllStores(): StoreData[] {
  if (typeof window === "undefined") return [];
  const savedStores = localStorage.getItem("marlon_stores");
  return savedStores ? JSON.parse(savedStores) : [];
}

/**
 * Get store by slug from localStorage
 */
export function getStoreBySlug(slug: string): StoreData | null {
  if (typeof window === "undefined") return null;
  const savedStore = localStorage.getItem(`marlon_stores_${slug}`);
  return savedStore ? JSON.parse(savedStore) : null;
}

/**
 * Check if store is locked and past the 20-day retention period
 */
export function isStoreEligibleForOrderDeletion(store: StoreData): boolean {
  if (store.subscription !== "locked") return false;
  if (!store.lockedAt) return false;
  
  const now = Date.now();
  return (now - store.lockedAt) > LOCKED_ORDER_RETENTION_MS;
}

/**
 * Delete orders older than the retention period for locked stores
 * This should be called when loading orders or periodically
 * 
 * @param slug - Store slug to check
 * @returns Number of deleted orders
 */
export async function cleanupLockedStoreOrders(slug: string): Promise<number> {
  if (typeof window === "undefined") return 0;
  
  const store = getStoreBySlug(slug);
  if (!store) return 0;
  
  // Check if store is eligible for order deletion
  if (!isStoreEligibleForOrderDeletion(store)) return 0;
  
  // Get orders for this store
  const savedOrders = localStorage.getItem(`marlon_orders_${slug}`);
  if (!savedOrders) return 0;
  
  const orders: Order[] = JSON.parse(savedOrders);
  const cutoffDate = store.lockedAt! - LOCKED_ORDER_RETENTION_MS;
  
  // Filter out orders that were created before the store was locked
  // (keeping orders created during the locked period but within 20 days)
  const ordersToKeep = orders.filter(order => order.createdAt > cutoffDate);
  
  const deletedCount = orders.length - ordersToKeep.length;
  
  if (deletedCount > 0) {
    localStorage.setItem(`marlon_orders_${slug}`, JSON.stringify(ordersToKeep));
    console.log(`[Auto-cleanup] Deleted ${deletedCount} orders from locked store "${store.name}" (older than 20 days)`);
  }
  
  return deletedCount;
}

/**
 * Mark store as locked and set lockedAt timestamp
 * Should be called when store status changes to "locked"
 */
export function lockStore(slug: string): void {
  if (typeof window === "undefined") return;
  
  // Update individual store
  const savedStore = localStorage.getItem(`marlon_stores_${slug}`);
  if (savedStore) {
    const store: StoreData = JSON.parse(savedStore);
    store.subscription = "locked";
    store.lockedAt = Date.now();
    localStorage.setItem(`marlon_stores_${slug}`, JSON.stringify(store));
  }
  
  // Update in stores list
  const stores = getAllStores();
  const updatedStores = stores.map(s => {
    if (s.slug === slug) {
      return { ...s, subscription: "locked" as const, lockedAt: Date.now() };
    }
    return s;
  });
  localStorage.setItem("marlon_stores", JSON.stringify(updatedStores));
}

/**
 * Unlock store and clear lockedAt
 * Should be called when store pays and becomes active
 */
export function unlockStore(slug: string): void {
  if (typeof window === "undefined") return;
  
  // Update individual store
  const savedStore = localStorage.getItem(`marlon_stores_${slug}`);
  if (savedStore) {
    const store: StoreData = JSON.parse(savedStore);
    store.subscription = "active";
    delete store.lockedAt;
    localStorage.setItem(`marlon_stores_${slug}`, JSON.stringify(store));
  }
  
  // Update in stores list
  const stores = getAllStores();
  const updatedStores = stores.map(s => {
    if (s.slug === slug) {
      return { ...s, subscription: "active" as const };
    }
    return s;
  });
  localStorage.setItem("marlon_stores", JSON.stringify(updatedStores));
}

/**
 * Run cleanup for all locked stores
 * Can be called periodically or on app initialization
 */
export async function cleanupAllLockedStores(): Promise<number> {
  if (typeof window === "undefined") return 0;
  
  const stores = getAllStores();
  let totalDeleted = 0;
  
  for (const store of stores) {
    if (store.subscription === "locked" && store.lockedAt) {
      const deleted = await cleanupLockedStoreOrders(store.slug);
      totalDeleted += deleted;
    }
  }
  
  return totalDeleted;
}

/**
 * Format locked date info for display
 */
export function getLockedStoreInfo(store: StoreData): { daysRemaining: number; isExpired: boolean } | null {
  if (store.subscription !== "locked" || !store.lockedAt) return null;
  
  const now = Date.now();
  const daysSinceLocked = Math.floor((now - store.lockedAt) / (24 * 60 * 60 * 1000));
  const daysRemaining = LOCKED_ORDER_RETENTION_DAYS - daysSinceLocked;
  
  return {
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: daysRemaining <= 0
  };
}

/**
 * Handle subscription expiry when a new order is placed
 * 
 * Per PRD §Billing State Machine:
 * - Check if store.subscriptionPaidUntil < now
 * - If expired: set subscriptionStatus = 'trial', reset orderCount = 1, set firstOrderAt = now
 * - Store does NOT go to 'locked' on expiry — only locks after new window hits 50 orders
 * 
 * @param slug - Store slug
 * @returns Updated store data or null if not found
 */
export function handleSubscriptionExpiryOnOrder(slug: string): StoreData | null {
  if (typeof window === "undefined") return null;
  
  const savedStore = localStorage.getItem(`marlon_stores_${slug}`);
  if (!savedStore) return null;
  
  const store: StoreData = JSON.parse(savedStore);
  const now = Date.now();
  
  // Check if subscription has expired
  const hasExpired = store.subscriptionPaidUntil && store.subscriptionPaidUntil < now;
  
  if (hasExpired && store.subscription === "active") {
    // Expiry detected - revert to trial
    // Reset order count to 1 (the current order)
    // Start new 30-day window
    store.subscription = "trial";
    store.orderCount = 1;
    store.firstOrderAt = now;
    delete store.subscriptionPaidUntil;
    delete store.lockedAt;
    
    localStorage.setItem(`marlon_stores_${slug}`, JSON.stringify(store));
    
    // Also update in stores list
    const stores = getAllStores();
    const updatedStores = stores.map(s => {
      if (s.slug === slug) {
        return {
          ...s,
          subscription: "trial" as const,
          orderCount: 1,
          firstOrderAt: now
        };
      }
      return s;
    });
    localStorage.setItem("marlon_stores", JSON.stringify(updatedStores));
    
    console.log(`[Subscription] Store "${store.name}" subscription expired. Reverted to trial with 1 order.`);
    
    return store;
  }
  
  // If already in trial, check if we need to increment order count
  if (store.subscription === "trial" && store.firstOrderAt) {
    const currentOrderCount = store.orderCount || 1;
    store.orderCount = currentOrderCount + 1;
    
    // Check if trial window has expired (30 days passed)
    const trialWindowExpired = (now - store.firstOrderAt) > TRIAL_WINDOW_MS;
    
    if (trialWindowExpired) {
      // Start new 30-day window with this order as count = 1
      store.firstOrderAt = now;
      store.orderCount = 1;
    }
    
    // Check if order count exceeds 50 - lock the store
    if (store.orderCount > MAX_ORDERS_BEFORE_LOCK) {
      store.subscription = "locked";
      store.lockedAt = now;
      console.log(`[Subscription] Store "${store.name}" locked due to exceeding ${MAX_ORDERS_BEFORE_LOCK} orders in trial period.`);
    }
    
    localStorage.setItem(`marlon_stores_${slug}`, JSON.stringify(store));
    
    // Also update in stores list
    const stores = getAllStores();
    const updatedStores = stores.map(s => {
      if (s.slug === slug) {
        return { ...s, orderCount: store.orderCount, firstOrderAt: store.firstOrderAt };
      }
      return s;
    });
    localStorage.setItem("marlon_stores", JSON.stringify(updatedStores));
    
    return store;
  }
  
  // For active subscriptions, increment order count
  if (store.subscription === "active") {
    store.orderCount = (store.orderCount || 0) + 1;
    localStorage.setItem(`marlon_stores_${slug}`, JSON.stringify(store));
    
    const stores = getAllStores();
    const updatedStores = stores.map(s => {
      if (s.slug === slug) {
        return { ...s, orderCount: store.orderCount };
      }
      return s;
    });
    localStorage.setItem("marlon_stores", JSON.stringify(updatedStores));
  }
  
  return store;
}

/**
 * Get trial window status for a store
 */
export function getTrialWindowInfo(store: StoreData): { 
  daysRemaining: number; 
  ordersUsed: number; 
  ordersRemaining: number;
  isLocked: boolean;
} | null {
  if (!store.firstOrderAt) return null;
  
  const now = Date.now();
  const daysRemaining = Math.max(0, TRIAL_WINDOW_DAYS - Math.floor((now - store.firstOrderAt) / (24 * 60 * 60 * 1000)));
  const ordersUsed = store.orderCount || 1;
  
  return {
    daysRemaining,
    ordersUsed,
    ordersRemaining: Math.max(0, MAX_ORDERS_BEFORE_LOCK - ordersUsed),
    isLocked: store.subscription === "locked"
  };
}

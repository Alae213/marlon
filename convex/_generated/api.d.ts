/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as canonicalBilling from "../canonicalBilling.js";
import type * as canonicalBillingMigrations from "../canonicalBillingMigrations.js";
import type * as deliveryAnalytics from "../deliveryAnalytics.js";
import type * as deliveryCredentialsCrypto from "../deliveryCredentialsCrypto.js";
import type * as deliveryProvider from "../deliveryProvider.js";
import type * as memberships from "../memberships.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as performanceBackfill from "../performanceBackfill.js";
import type * as performanceHelpers from "../performanceHelpers.js";
import type * as products from "../products.js";
import type * as siteContent from "../siteContent.js";
import type * as storeAccess from "../storeAccess.js";
import type * as storeAccessLib from "../storeAccessLib.js";
import type * as stores from "../stores.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  canonicalBilling: typeof canonicalBilling;
  canonicalBillingMigrations: typeof canonicalBillingMigrations;
  deliveryAnalytics: typeof deliveryAnalytics;
  deliveryCredentialsCrypto: typeof deliveryCredentialsCrypto;
  deliveryProvider: typeof deliveryProvider;
  memberships: typeof memberships;
  orders: typeof orders;
  payments: typeof payments;
  performanceBackfill: typeof performanceBackfill;
  performanceHelpers: typeof performanceHelpers;
  products: typeof products;
  siteContent: typeof siteContent;
  storeAccess: typeof storeAccess;
  storeAccessLib: typeof storeAccessLib;
  stores: typeof stores;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

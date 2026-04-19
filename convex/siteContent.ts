import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { assertStoreRole } from "./storeAccess";
import {
  decryptDeliveryCredentials,
  encryptDeliveryCredentials,
} from "./deliveryCredentialsCrypto";
import { normalizeDeliveryProvider } from "./deliveryProvider";
import {
  DEFAULT_HERO_ALIGNMENT,
  DEFAULT_HERO_BG_URL,
  DEFAULT_HERO_CTA,
  DEFAULT_HERO_CTA_COLOR,
  DEFAULT_HERO_FOCAL_X,
  DEFAULT_HERO_FOCAL_Y,
  DEFAULT_HERO_TITLE,
  DEFAULT_HERO_TITLE_COLOR,
  DEFAULT_HERO_ZOOM,
} from "../lib/hero-content";

const TEST_CONNECTION_RATE_LIMIT_WINDOW_MS = 60_000;
const TEST_CONNECTION_RATE_LIMIT_MAX_REQUESTS = 5;
const testConnectionRateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = testConnectionRateLimit.get(key);

  if (!existing || existing.resetAt <= now) {
    testConnectionRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  testConnectionRateLimit.set(key, existing);
  return { limited: false, retryAfterSeconds: 0 };
}

async function assertStoreOwner(ctx: Parameters<typeof assertStoreRole>[0], storeId: Id<"stores">) {
  return await assertStoreRole(ctx, storeId, "owner");
}

// Type definitions for site content

interface NavbarContent {
  logo?: string;
  logoStorageId?: Id<"_storage">;
  logoUrl?: string;
  background?: "dark" | "light" | "glass";
  textColor?: "dark" | "light";
  showCart?: boolean;
}

interface HeroContent {
  title?: string;
  ctaText?: string;
  titleColor?: string;
  ctaColor?: string;
  alignment?: "left" | "center" | "right";
  backgroundImageStorageId?: Id<"_storage">;
  backgroundImageUrl?: string;
  focalPointX?: number;
  focalPointY?: number;
  zoom?: number;
}

interface DeliveryIntegrationContent {
  provider?: "yalidine" | "zr-express" | "andrson" | "noest" | "none";
  enabledProviders?: ("yalidine" | "zr-express" | "andrson" | "noest")[];
  hasCredentials?: boolean;
  lastUpdatedAt?: number;
  credentials?: DeliveryCredentialsInput;
  apiKey?: string;
  apiToken?: string;
  apiSecret?: string;
  accountNumber?: string;
}

type DeliveryCredentialsInput = {
  apiKey?: string;
  apiToken?: string;
  apiSecret?: string;
  accountNumber?: string;
};

type SiteContent = NavbarContent | HeroContent | DeliveryIntegrationContent;

// Get site content for a store
export const getSiteContent = query({
  args: { storeId: v.id("stores"), section: v.string() },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) =>
        q.eq("storeId", args.storeId).eq("section", args.section)
      )
      .first();

    if (!content) {
      if (args.section === "navbar") {
        return { content: DEFAULT_NAVBAR };
      }
      if (args.section === "hero") {
        return { content: DEFAULT_HERO };
      }
      return null;
    }

    const typedContent = content.content as SiteContent;

    if (args.section === "navbar" && (typedContent as NavbarContent)?.logoStorageId) {
      const logoUrl = await ctx.storage.getUrl((typedContent as NavbarContent).logoStorageId!);
      return { ...content, content: { ...typedContent, logoUrl } };
    }

    return content;
  },
});

// Get site content for a store with resolved URLs
export const getSiteContentResolved = query({
  args: { storeId: v.id("stores"), section: v.string() },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) =>
        q.eq("storeId", args.storeId).eq("section", args.section)
      )
      .first();

    if (!content) return null;

    const typedContent = content.content as SiteContent;

    // Resolve URLs for different content types
    if (args.section === "navbar" && (typedContent as NavbarContent)?.logoStorageId) {
      const logoUrl = await ctx.storage.getUrl((typedContent as NavbarContent).logoStorageId!);
      return { ...content, content: { ...typedContent, logoUrl } };
    }

    if (args.section === "hero" && (typedContent as HeroContent)?.backgroundImageStorageId) {
      const backgroundImageUrl = await ctx.storage.getUrl((typedContent as HeroContent).backgroundImageStorageId!);
      return {
        ...content,
        content: { ...DEFAULT_HERO, ...typedContent, backgroundImageUrl },
      };
    }

    if (args.section === "hero") {
      return {
        ...content,
        content: { ...DEFAULT_HERO, ...typedContent },
      };
    }

    return content;
  },
});

// Get all site content for a store
export const getAllSiteContent = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const contents = await ctx.db
      .query("siteContent")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    return contents;
  },
});

// Update site content
export const updateSiteContent = mutation({
  args: {
    storeId: v.id("stores"),
    section: v.string(),
    content: v.any(),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) =>
        q.eq("storeId", args.storeId).eq("section", args.section)
      )
      .first();
    
    const now = Date.now();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("siteContent", {
        storeId: args.storeId,
        section: args.section,
        content: args.content,
        updatedAt: now,
      });
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const setNavbarStyles = mutation({
  args: {
    storeId: v.id("stores"),
    background: v.optional(v.union(v.literal("dark"), v.literal("light"), v.literal("glass"))),
    textColor: v.optional(v.union(v.literal("dark"), v.literal("light"))),
    showCart: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    const now = Date.now();
    const baseContent = existing?.content as NavbarContent ?? DEFAULT_NAVBAR;

    // Lock text color based on background mode
    let nextTextColor = args.textColor;
    if (args.background === "light") {
      nextTextColor = "dark"; // Lock to dark for light mode
    } else if (args.background === "dark") {
      nextTextColor = "light"; // Lock to light for dark mode
    }
    // For glass mode, allow text color to be set

    const nextContent: NavbarContent = {
      ...baseContent,
      ...(args.background ? { background: args.background } : {}),
      ...(nextTextColor ? { textColor: nextTextColor } : {}),
      ...(args.showCart !== undefined ? { showCart: args.showCart } : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, { content: nextContent, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("siteContent", {
      storeId: args.storeId,
      section: "navbar",
      content: nextContent,
      updatedAt: now,
    });
  },
});

// Delete logo (remove from navbar)
export const deleteNavbarLogo = mutation({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    if (!existing) return null;

    const now = Date.now();
    const baseContent = existing.content as NavbarContent;

    const nextContent: NavbarContent = {
      ...baseContent,
      logoStorageId: undefined,
      logoUrl: undefined,
    };

    await ctx.db.patch(existing._id, { content: nextContent, updatedAt: now });
    return existing._id;
  },
});

export const setNavbarLogo = mutation({
  args: {
    storeId: v.id("stores"),
    logoStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const now = Date.now();

    const navbarDoc = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    const nextNavbar: NavbarContent = {
      ...(navbarDoc?.content ?? DEFAULT_NAVBAR),
      logoStorageId: args.logoStorageId,
    };

    if (navbarDoc) {
      await ctx.db.patch(navbarDoc._id, { content: nextNavbar, updatedAt: now });
    } else {
      await ctx.db.insert("siteContent", {
        storeId: args.storeId,
        section: "navbar",
        content: nextNavbar,
        updatedAt: now,
      });
    }

    return true;
  },
});

export const setHeroStyles = mutation({
  args: {
    storeId: v.id("stores"),
    title: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    titleColor: v.optional(v.string()),
    ctaColor: v.optional(v.string()),
    alignment: v.optional(v.union(v.literal("left"), v.literal("center"), v.literal("right"))),
    backgroundImageStorageId: v.optional(v.id("_storage")),
    focalPointX: v.optional(v.number()),
    focalPointY: v.optional(v.number()),
    zoom: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "hero"))
      .first();

    const now = Date.now();
    const baseContent: HeroContent =
      (existing?.content as HeroContent | null | undefined) ?? DEFAULT_HERO;
    const nextContent: HeroContent = { ...baseContent };

    if (args.title !== undefined) nextContent.title = args.title;
    if (args.ctaText !== undefined) nextContent.ctaText = args.ctaText;
    if (args.titleColor !== undefined) nextContent.titleColor = args.titleColor;
    if (args.ctaColor !== undefined) nextContent.ctaColor = args.ctaColor;
    if (args.alignment !== undefined) nextContent.alignment = args.alignment;
    if (args.backgroundImageStorageId !== undefined) {
      nextContent.backgroundImageStorageId = args.backgroundImageStorageId;
    }
    if (args.focalPointX !== undefined) nextContent.focalPointX = args.focalPointX;
    if (args.focalPointY !== undefined) nextContent.focalPointY = args.focalPointY;
    if (args.zoom !== undefined) nextContent.zoom = args.zoom;

    if (existing) {
      await ctx.db.patch(existing._id, { content: nextContent, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("siteContent", {
      storeId: args.storeId,
      section: "hero",
      content: nextContent,
      updatedAt: now,
    });
  },
});

// Delivery Pricing Functions
export const getDeliveryPricing = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const pricing = await ctx.db
      .query("deliveryPricing")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    return pricing;
  },
});

export const setDeliveryPricing = mutation({
  args: {
    storeId: v.id("stores"),
    wilaya: v.string(),
    homeDelivery: v.optional(v.number()),
    officeDelivery: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const existing = await ctx.db
      .query("deliveryPricing")
      .withIndex("wilaya", (q) => q.eq("storeId", args.storeId).eq("wilaya", args.wilaya))
      .first();

    const now = Date.now();

    if (existing) {
      const nextHome = args.homeDelivery ?? existing.homeDelivery;
      const nextOffice = args.officeDelivery ?? existing.officeDelivery;
      if (nextHome === existing.homeDelivery && nextOffice === existing.officeDelivery) {
        return existing._id;
      }

      const updates: {
        homeDelivery?: number;
        officeDelivery?: number;
        updatedAt: number;
      } = { updatedAt: now };

      if (args.homeDelivery !== undefined) {
        updates.homeDelivery = args.homeDelivery;
      }

      if (args.officeDelivery !== undefined) {
        updates.officeDelivery = args.officeDelivery;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    const newPricing: {
      storeId: Id<"stores">;
      wilaya: string;
      homeDelivery?: number;
      officeDelivery?: number;
      updatedAt: number;
    } = {
      storeId: args.storeId,
      wilaya: args.wilaya,
      updatedAt: now,
    };

    if (args.homeDelivery !== undefined) {
      newPricing.homeDelivery = args.homeDelivery;
    }

    if (args.officeDelivery !== undefined) {
      newPricing.officeDelivery = args.officeDelivery;
    }

    return await ctx.db.insert("deliveryPricing", newPricing);
  },
});

export const bulkSetDeliveryPricing = mutation({
  args: {
    storeId: v.id("stores"),
    pricing: v.array(v.object({
      wilaya: v.string(),
      homeDelivery: v.optional(v.number()),
      officeDelivery: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const now = Date.now();
    
    for (const p of args.pricing) {
      const existing = await ctx.db
        .query("deliveryPricing")
        .withIndex("wilaya", (q) => q.eq("storeId", args.storeId).eq("wilaya", p.wilaya))
        .first();

      if (existing) {
        const nextHome = p.homeDelivery ?? existing.homeDelivery;
        const nextOffice = p.officeDelivery ?? existing.officeDelivery;
        if (nextHome === existing.homeDelivery && nextOffice === existing.officeDelivery) {
          continue;
        }

        const updates: {
          homeDelivery?: number;
          officeDelivery?: number;
          updatedAt: number;
        } = { updatedAt: now };

        if (p.homeDelivery !== undefined) {
          updates.homeDelivery = p.homeDelivery;
        }

        if (p.officeDelivery !== undefined) {
          updates.officeDelivery = p.officeDelivery;
        }

        await ctx.db.patch(existing._id, updates);
      } else {
        const newPricing: {
          storeId: Id<"stores">;
          wilaya: string;
          homeDelivery?: number;
          officeDelivery?: number;
          updatedAt: number;
        } = {
          storeId: args.storeId,
          wilaya: p.wilaya,
          updatedAt: now,
        };

        if (p.homeDelivery !== undefined) {
          newPricing.homeDelivery = p.homeDelivery;
        }

        if (p.officeDelivery !== undefined) {
          newPricing.officeDelivery = p.officeDelivery;
        }

        await ctx.db.insert("deliveryPricing", newPricing);
      }
    }
    
    return true;
  },
});

function sanitizeCredentialValue(value?: string): string {
  return value?.trim() ?? "";
}

function mergeCredentialSources(args: {
  credentials?: DeliveryCredentialsInput;
  apiKey?: string;
  apiToken?: string;
  apiSecret?: string;
  accountNumber?: string;
}) {
  return {
    apiKey: sanitizeCredentialValue(args.credentials?.apiKey ?? args.apiKey),
    apiToken: sanitizeCredentialValue(args.credentials?.apiToken ?? args.apiToken),
    apiSecret: sanitizeCredentialValue(
      args.credentials?.apiSecret ?? args.apiSecret ?? args.credentials?.apiToken ?? args.apiToken
    ),
    accountNumber: sanitizeCredentialValue(args.credentials?.accountNumber ?? args.accountNumber),
  };
}

function hasAnyDeliveryCredential(credentials: {
  apiKey: string;
  apiToken: string;
  apiSecret: string;
  accountNumber: string;
}) {
  return Boolean(
    credentials.apiKey ||
      credentials.apiToken ||
      credentials.apiSecret ||
      credentials.accountNumber
  );
}

function getCanonicalProvider(provider?: string | null): "yalidine" | "zr-express" | "andrson" | "noest" | "none" {
  return normalizeDeliveryProvider(provider);
}

type SupportedDeliveryProvider = "yalidine" | "zr-express" | "andrson" | "noest";

function normalizeEnabledProviders(enabledProviders?: string[] | null): SupportedDeliveryProvider[] {
  const normalized = (enabledProviders ?? [])
    .map((provider) => getCanonicalProvider(provider))
    .filter((provider): provider is SupportedDeliveryProvider => provider !== "none");

  return [...new Set(normalized)];
}

function deriveEnabledProviders(content?: DeliveryIntegrationContent | null): SupportedDeliveryProvider[] {
  const normalizedEnabledProviders = normalizeEnabledProviders(content?.enabledProviders);
  if (normalizedEnabledProviders.length > 0) {
    return normalizedEnabledProviders;
  }

  const provider = getCanonicalProvider(content?.provider);
  if (provider === "none") {
    return [];
  }

  return [provider];
}

function derivePrimaryProvider(
  preferredProvider: "yalidine" | "zr-express" | "andrson" | "noest" | "none",
  enabledProviders: SupportedDeliveryProvider[]
): "yalidine" | "zr-express" | "andrson" | "noest" | "none" {
  if (preferredProvider !== "none" && enabledProviders.includes(preferredProvider)) {
    return preferredProvider;
  }

  return enabledProviders[0] ?? "none";
}

// Delivery Integration Functions
export const getDeliveryIntegration = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const sectionDoc = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "deliveryIntegration"))
      .first();

    const content = (sectionDoc?.content as DeliveryIntegrationContent | null) ?? null;
    const persistedProvider = getCanonicalProvider(content?.provider);
    const enabledProviders = deriveEnabledProviders(content);
    const provider = derivePrimaryProvider(persistedProvider, enabledProviders);
    const lastUpdatedAt = content?.lastUpdatedAt ?? sectionDoc?.updatedAt ?? null;

    if (provider === "none") {
      return {
        provider,
        enabledProviders,
        hasCredentials: false,
        lastUpdatedAt,
        credentialsUpdatedAt: null,
      };
    }

    const allStoreCredentials = await ctx.db
      .query("deliveryCredentials")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const enabledProviderSet = new Set(enabledProviders);
    const enabledProviderCredentials = allStoreCredentials.filter((row) => {
      const rowProvider = getCanonicalProvider(row.provider);
      return rowProvider !== "none" && enabledProviderSet.has(rowProvider);
    });

    if (enabledProviderCredentials.length === 0) {
      const legacyCredentials = mergeCredentialSources({
        credentials: content?.credentials,
        apiKey: content?.apiKey,
        apiToken: content?.apiToken,
        apiSecret: content?.apiSecret,
        accountNumber: content?.accountNumber,
      });

      if (hasAnyDeliveryCredential(legacyCredentials)) {
        return {
          provider,
          enabledProviders,
          hasCredentials: true,
          lastUpdatedAt,
          credentialsUpdatedAt: null,
          fromLegacyPayload: true,
        };
      }

      return {
        provider,
        enabledProviders,
        hasCredentials: false,
        lastUpdatedAt,
        credentialsUpdatedAt: null,
      };
    }

    const credentialsUpdatedAt = Math.max(
      ...enabledProviderCredentials.map((credentialRow) => credentialRow.updatedAt)
    );

    return {
      provider,
      enabledProviders,
      hasCredentials: true,
      lastUpdatedAt,
      credentialsUpdatedAt,
    };
  },
});

export const getDeliveryCredentialsForOwnerRuntime = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const sectionDoc = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "deliveryIntegration"))
      .first();

    const content = (sectionDoc?.content as DeliveryIntegrationContent | null) ?? null;
    const persistedProvider = getCanonicalProvider(content?.provider);
    const enabledProviders = deriveEnabledProviders(content);
    const provider = derivePrimaryProvider(persistedProvider, enabledProviders);

    if (provider === "none") {
      return {
        provider,
        credentials: { apiKey: "", apiToken: "", apiSecret: "", accountNumber: "" },
        decryptionError: null,
      };
    }

    const allStoreCredentials = await ctx.db
      .query("deliveryCredentials")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const storedCredentials =
      allStoreCredentials.find((row) => getCanonicalProvider(row.provider) === provider) ?? null;

    if (!storedCredentials) {
      const legacyCredentials = mergeCredentialSources({
        credentials: content?.credentials,
        apiKey: content?.apiKey,
        apiToken: content?.apiToken,
        apiSecret: content?.apiSecret,
        accountNumber: content?.accountNumber,
      });

      return {
        provider,
        credentials: legacyCredentials,
        decryptionError: null,
      };
    }

    try {
      const credentials = await decryptDeliveryCredentials({
        ciphertextHex: storedCredentials.ciphertextHex,
        ivHex: storedCredentials.ivHex,
      });

      return {
        provider,
        credentials,
        decryptionError: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to decrypt credentials.";
      return {
        provider,
        credentials: { apiKey: "", apiToken: "", apiSecret: "", accountNumber: "" },
        decryptionError: message,
      };
    }
  },
});

export const setDeliveryIntegration = mutation({
  args: {
    storeId: v.id("stores"),
    provider: v.optional(
      v.union(
        v.literal("zr-express"),
        v.literal("zr_express"),
        v.literal("yalidine"),
        v.literal("andrson"),
        v.literal("noest"),
        v.literal("none")
      )
    ),
    enabledProviders: v.optional(v.array(v.string())),
    credentials: v.optional(
      v.object({
        apiKey: v.optional(v.string()),
        apiToken: v.optional(v.string()),
        apiSecret: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
      })
    ),
    apiKey: v.optional(v.string()),
    apiToken: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "deliveryIntegration"))
      .first();

    const now = Date.now();
    const content = (existing?.content as DeliveryIntegrationContent | null) ?? { provider: "none" };
    const providerFromArgs =
      args.provider !== undefined ? getCanonicalProvider(args.provider) : undefined;
    let enabledProviders =
      args.enabledProviders !== undefined
        ? normalizeEnabledProviders(args.enabledProviders)
        : deriveEnabledProviders(content);

    if (providerFromArgs === "none") {
      enabledProviders = [];
    } else if (providerFromArgs && !enabledProviders.includes(providerFromArgs)) {
      enabledProviders = [providerFromArgs, ...enabledProviders];
    }

    const persistedProvider = getCanonicalProvider(content.provider);
    const provider = derivePrimaryProvider(providerFromArgs ?? persistedProvider, enabledProviders);
    const mergedCredentials = mergeCredentialSources(args);
    const legacyCredentials = mergeCredentialSources({
      credentials: content.credentials,
      apiKey: content.apiKey,
      apiToken: content.apiToken,
      apiSecret: content.apiSecret,
      accountNumber: content.accountNumber,
    });

    const allStoreCredentials = await ctx.db
      .query("deliveryCredentials")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const providerRow =
      provider === "none"
        ? null
        : allStoreCredentials.find((row) => getCanonicalProvider(row.provider) === provider) ?? null;

    let upsertedProviderCredential = false;

    if (provider !== "none") {
      if (hasAnyDeliveryCredential(mergedCredentials)) {
        const encrypted = await encryptDeliveryCredentials(mergedCredentials);
        if (providerRow) {
          await ctx.db.patch(providerRow._id, {
            algorithm: "aes-256-gcm",
            ciphertextHex: encrypted.ciphertextHex,
            ivHex: encrypted.ivHex,
            updatedAt: now,
          });
        } else {
          await ctx.db.insert("deliveryCredentials", {
            storeId: args.storeId,
            provider,
            algorithm: "aes-256-gcm",
            ciphertextHex: encrypted.ciphertextHex,
            ivHex: encrypted.ivHex,
            createdAt: now,
            updatedAt: now,
          });
        }
        upsertedProviderCredential = true;
      } else if (!providerRow && hasAnyDeliveryCredential(legacyCredentials)) {
        const encrypted = await encryptDeliveryCredentials(legacyCredentials);
        await ctx.db.insert("deliveryCredentials", {
          storeId: args.storeId,
          provider,
          algorithm: "aes-256-gcm",
          ciphertextHex: encrypted.ciphertextHex,
          ivHex: encrypted.ivHex,
          createdAt: now,
          updatedAt: now,
        });
        upsertedProviderCredential = true;
      }
    }

    const enabledProviderSet = new Set(enabledProviders);
    const hasStoredCredentialsForEnabledProviders =
      allStoreCredentials.some((row) => {
        const rowProvider = getCanonicalProvider(row.provider);
        return rowProvider !== "none" && enabledProviderSet.has(rowProvider);
      }) || upsertedProviderCredential;

    const hasCredentials =
      hasStoredCredentialsForEnabledProviders ||
      (provider !== "none" &&
        enabledProviderSet.has(provider) &&
        !providerRow &&
        !hasAnyDeliveryCredential(mergedCredentials) &&
        hasAnyDeliveryCredential(legacyCredentials));

    const nextContent: DeliveryIntegrationContent = {
      provider,
      enabledProviders,
      hasCredentials,
      lastUpdatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, { content: nextContent, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("siteContent", {
      storeId: args.storeId,
      section: "deliveryIntegration",
      content: nextContent,
      updatedAt: now,
    });
  },
});

export const testDeliveryConnection = action({
  args: {
    storeId: v.id("stores"),
    provider: v.optional(
      v.union(
        v.literal("zr-express"),
        v.literal("zr_express"),
        v.literal("yalidine"),
        v.literal("andrson"),
        v.literal("noest")
      )
    ),
    credentials: v.optional(
      v.object({
        apiKey: v.optional(v.string()),
        apiToken: v.optional(v.string()),
        apiSecret: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
      })
    ),
    apiKey: v.optional(v.string()),
    apiToken: v.optional(v.string()),
    apiSecret: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { success: false, message: "Unauthorized" };
      }

      try {
        await ctx.runQuery(api.storeAccess.getViewerStoreAccess, {
          storeId: args.storeId,
          minimumRole: "owner",
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Store not found") {
          return { success: false, message: "Store not found." };
        }

        if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
          return { success: false, message: error.message };
        }

        throw error;
      }

      const rateLimitKey = `${identity.subject}:${args.storeId}`;
      const rateLimit = isRateLimited(
        rateLimitKey,
        TEST_CONNECTION_RATE_LIMIT_MAX_REQUESTS,
        TEST_CONNECTION_RATE_LIMIT_WINDOW_MS
      );

      if (rateLimit.limited) {
        return {
          success: false,
          message: `Too many test attempts. Try again in ${rateLimit.retryAfterSeconds}s.`,
        };
      }

      const integration = await ctx.runQuery(api.siteContent.getDeliveryCredentialsForOwnerRuntime, {
        storeId: args.storeId,
      });

      const sectionProvider = getCanonicalProvider(integration?.provider);
      const provider = getCanonicalProvider(args.provider ?? sectionProvider);

      if (provider === "none") {
        return { success: false, message: "No delivery provider selected for this store." };
      }

      const inputCredentials = mergeCredentialSources(args);
      const hasInputCredentials = hasAnyDeliveryCredential(inputCredentials);

      let credentials = inputCredentials;

      if (!hasInputCredentials) {
        if (typeof integration?.decryptionError === "string" && integration.decryptionError.includes("DELIVERY_CREDENTIALS_KEY")) {
          return {
            success: false,
            message:
              "Missing DELIVERY_CREDENTIALS_KEY. Configure it in Convex environment settings before testing delivery credentials.",
          };
        }

        credentials = {
          apiKey: integration?.credentials?.apiKey ?? "",
          apiToken: integration?.credentials?.apiToken ?? "",
          apiSecret: integration?.credentials?.apiSecret ?? "",
          accountNumber: integration?.credentials?.accountNumber ?? "",
        };
      }

      if (!credentials.apiKey) {
        return { success: false, message: "API key is required." };
      }

      if (provider === "zr-express" && !(credentials.apiSecret || credentials.apiToken)) {
        return { success: false, message: "ZR Express requires API secret or API token." };
      }

      if (provider === "yalidine" && !(credentials.apiToken || credentials.apiSecret)) {
        return { success: false, message: "Yalidine requires API token or API secret." };
      }

      if (provider === "zr-express") {
        const response = await fetch("https://api.zrexpress.dz/v1/test", {
          headers: {
            "Authorization": `Bearer ${credentials.apiKey}`,
            "X-API-SECRET": credentials.apiSecret || credentials.apiToken,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          return { success: true, message: "Connection successful. ZR Express credentials are valid." };
        }
        return {
          success: false,
          message: "ZR Express rejected these credentials. Recheck API key/secret and account access.",
        };
      }

      if (provider === "yalidine") {
        const response = await fetch("https://api.yalidine.com/v1/test", {
          headers: {
            "X-API-Key": credentials.apiKey,
            "X-API-Token": credentials.apiToken || credentials.apiSecret,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          return { success: true, message: "Connection successful. Yalidine credentials are valid." };
        }
        return {
          success: false,
          message: "Yalidine rejected these credentials. Recheck API key/token and account access.",
        };
      }
      return { success: false, message: "Unsupported provider." };
    } catch (error) {
      if (error instanceof Error && error.message.includes("DELIVERY_CREDENTIALS_KEY")) {
        return {
          success: false,
          message:
            "Missing DELIVERY_CREDENTIALS_KEY. Configure it in Convex environment settings before testing delivery credentials.",
        };
      }
      return {
        success: false,
        message: "Connection test failed because of a network or provider issue. Please retry.",
      };
    }
  },
});

// Default site content templates
export const DEFAULT_NAVBAR: NavbarContent = {
  logoStorageId: undefined,
  logoUrl: undefined,
  background: "light",
  textColor: "dark",
  showCart: true,
};

export const DEFAULT_HERO: HeroContent = {
  title: DEFAULT_HERO_TITLE,
  ctaText: DEFAULT_HERO_CTA,
  titleColor: DEFAULT_HERO_TITLE_COLOR,
  ctaColor: DEFAULT_HERO_CTA_COLOR,
  alignment: DEFAULT_HERO_ALIGNMENT,
  backgroundImageUrl: DEFAULT_HERO_BG_URL,
  focalPointX: DEFAULT_HERO_FOCAL_X,
  focalPointY: DEFAULT_HERO_FOCAL_Y,
  zoom: DEFAULT_HERO_ZOOM,
};
// Initialize default site content for a new store
export const initializeSiteContent = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const now = Date.now();
    
    const sections = [
      { section: "navbar", content: DEFAULT_NAVBAR },
      { section: "hero", content: DEFAULT_HERO },
          ];
    
    for (const { section, content } of sections) {
      const existing = await ctx.db
        .query("siteContent")
        .withIndex("section", (q) =>
          q.eq("storeId", args.storeId).eq("section", section)
        )
        .first();
      
      if (!existing) {
        await ctx.db.insert("siteContent", {
          storeId: args.storeId,
          section,
          content,
          updatedAt: now,
        });
      }
    }
    
    return true;
  },
});

// Remove legacy footer content for a single store
export const removeFooterContentForStore = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwner(ctx, args.storeId);

    const footerDocs = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "footer"))
      .collect();

    for (const doc of footerDocs) {
      await ctx.db.delete(doc._id);
    }

    return { deletedCount: footerDocs.length };
  },
});

// Remove all legacy footer content for stores owned by the signed-in user
export const removeAllOwnedFooterContent = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const stores = await ctx.db
      .query("stores")
      .withIndex("ownerId", (q) => q.eq("ownerId", identity.subject))
      .collect();

    let deletedCount = 0;
    for (const store of stores) {
      const footerDocs = await ctx.db
        .query("siteContent")
        .withIndex("section", (q) => q.eq("storeId", store._id).eq("section", "footer"))
        .collect();

      for (const doc of footerDocs) {
        await ctx.db.delete(doc._id);
        deletedCount += 1;
      }
    }

    return { deletedCount };
  },
});

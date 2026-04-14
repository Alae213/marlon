import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  decryptDeliveryCredentials,
  encryptDeliveryCredentials,
} from "./deliveryCredentialsCrypto";
import { normalizeDeliveryProvider } from "./deliveryProvider";

type StoreOwnerAuthContext = {
  db: { get: (id: Id<"stores">) => Promise<Doc<"stores"> | null> };
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
};

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

async function assertStoreOwner(ctx: StoreOwnerAuthContext, storeId: Id<"stores">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const store = await ctx.db.get(storeId);
  if (!store) {
    throw new Error("Store not found");
  }

  if (store.ownerId !== identity.subject) {
    throw new Error("Forbidden");
  }

  return { identity, store };
}

// Type definitions for site content

// Navbar link structure
interface NavbarLink {
  id: string;
  text: string;
  url: string;
  isDefault: boolean;
  enabled: boolean;
}

interface NavbarContent {
  logo?: string;
  logoStorageId?: string;
  logoUrl?: string;
  background?: "dark" | "light" | "glass";
  textColor?: "dark" | "light";
  showCart?: boolean;
  links: NavbarLink[];
}

interface HeroContent {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaColor?: string;
  ctaLink?: string;
  layout?: "left" | "center" | "right";
  backgroundImageStorageId?: string;
  backgroundImageUrl?: string;
  backgroundImage?: string;
}

interface FooterContent {
  logo?: string;
  logoStorageId?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  copyright?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
    enabled: boolean;
  }>;
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

type SiteContent = NavbarContent | HeroContent | FooterContent | DeliveryIntegrationContent;

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

    if (!content) return null;

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
      return { ...content, content: { ...typedContent, backgroundImageUrl } };
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

// Set all navbar links (for reordering)
export const setNavbarLinks = mutation({
  args: {
    storeId: v.id("stores"),
    links: v.array(v.object({
      id: v.string(),
      text: v.string(),
      url: v.string(),
      isDefault: v.boolean(),
      enabled: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    const now = Date.now();
    const baseContent = existing?.content as NavbarContent ?? DEFAULT_NAVBAR;

    const nextContent: NavbarContent = {
      ...baseContent,
      links: args.links,
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

// Add a single navbar link
export const addNavbarLink = mutation({
  args: {
    storeId: v.id("stores"),
    link: v.object({
      id: v.string(),
      text: v.string(),
      url: v.string(),
      isDefault: v.boolean(),
      enabled: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    const now = Date.now();
    const baseContent = existing?.content as NavbarContent ?? DEFAULT_NAVBAR;

    const nextContent: NavbarContent = {
      ...baseContent,
      links: [...baseContent.links, args.link],
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

// Remove a navbar link by ID
export const removeNavbarLink = mutation({
  args: {
    storeId: v.id("stores"),
    linkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    if (!existing) return null;

    const now = Date.now();
    const baseContent = existing.content as NavbarContent;

    // Filter out the link, but preserve default links
    const nextLinks = baseContent.links.filter(
      (link) => link.isDefault || link.id !== args.linkId
    );

    const nextContent: NavbarContent = {
      ...baseContent,
      links: nextLinks,
    };

    await ctx.db.patch(existing._id, { content: nextContent, updatedAt: now });
    return existing._id;
  },
});

// Update a navbar link
export const updateNavbarLink = mutation({
  args: {
    storeId: v.id("stores"),
    linkId: v.string(),
    text: v.optional(v.string()),
    url: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    if (!existing) return null;

    const now = Date.now();
    const baseContent = existing.content as NavbarContent;

    const nextLinks = baseContent.links.map((link) => {
      if (link.id === args.linkId) {
        return {
          ...link,
          ...(args.text !== undefined ? { text: args.text } : {}),
          ...(args.url !== undefined ? { url: args.url } : {}),
          ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
        };
      }
      return link;
    });

    const nextContent: NavbarContent = {
      ...baseContent,
      links: nextLinks,
    };

    await ctx.db.patch(existing._id, { content: nextContent, updatedAt: now });
    return existing._id;
  },
});

// Delete logo (remove from navbar)
export const deleteNavbarLogo = mutation({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
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

export const setLogoAndSyncFooter = mutation({
  args: {
    storeId: v.id("stores"),
    logoStorageId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const navbarDoc = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    const footerDoc = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "footer"))
      .first();

    const nextNavbar: NavbarContent = {
      ...(navbarDoc?.content ?? DEFAULT_NAVBAR),
      logoStorageId: args.logoStorageId,
    };

    const nextFooter: FooterContent = {
      ...(footerDoc?.content ?? DEFAULT_FOOTER),
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

    if (footerDoc) {
      await ctx.db.patch(footerDoc._id, { content: nextFooter, updatedAt: now });
    } else {
      await ctx.db.insert("siteContent", {
        storeId: args.storeId,
        section: "footer",
        content: nextFooter,
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
    ctaColor: v.optional(v.string()),
    layout: v.optional(v.union(v.literal("left"), v.literal("center"), v.literal("right"))),
    backgroundImageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "hero"))
      .first();

    const now = Date.now();
    const baseContent = existing?.content as HeroContent ?? DEFAULT_HERO;

    const nextContent: HeroContent = {
      ...baseContent,
      ...(args.title !== undefined ? { title: args.title } : {}),
      ...(args.ctaText !== undefined ? { ctaText: args.ctaText } : {}),
      ...(args.ctaColor !== undefined ? { ctaColor: args.ctaColor } : {}),
      ...(args.layout ? { layout: args.layout } : {}),
      ...(args.backgroundImageStorageId !== undefined ? { backgroundImageStorageId: args.backgroundImageStorageId } : {}),
    };

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

export const setFooterStyles = mutation({
  args: {
    storeId: v.id("stores"),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    copyright: v.optional(v.string()),
    socialLinks: v.optional(v.array(v.object({
      platform: v.string(),
      url: v.string(),
      enabled: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "footer"))
      .first();

    const now = Date.now();
    const baseContent = existing?.content as FooterContent ?? DEFAULT_FOOTER;

    const nextContent: FooterContent = {
      ...baseContent,
      ...(args.contactEmail !== undefined ? { contactEmail: args.contactEmail } : {}),
      ...(args.contactPhone !== undefined ? { contactPhone: args.contactPhone } : {}),
      ...(args.copyright !== undefined ? { copyright: args.copyright } : {}),
      ...(args.socialLinks ? { socialLinks: args.socialLinks } : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, { content: nextContent, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("siteContent", {
      storeId: args.storeId,
      section: "footer",
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
    const existing = await ctx.db
      .query("deliveryPricing")
      .withIndex("wilaya", (q) => q.eq("storeId", args.storeId).eq("wilaya", args.wilaya))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        homeDelivery: args.homeDelivery,
        officeDelivery: args.officeDelivery,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("deliveryPricing", {
      storeId: args.storeId,
      wilaya: args.wilaya,
      homeDelivery: args.homeDelivery,
      officeDelivery: args.officeDelivery,
      updatedAt: now,
    });
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
    const now = Date.now();
    
    for (const p of args.pricing) {
      const existing = await ctx.db
        .query("deliveryPricing")
        .withIndex("wilaya", (q) => q.eq("storeId", args.storeId).eq("wilaya", p.wilaya))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          homeDelivery: p.homeDelivery,
          officeDelivery: p.officeDelivery,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("deliveryPricing", {
          storeId: args.storeId,
          wilaya: p.wilaya,
          homeDelivery: p.homeDelivery,
          officeDelivery: p.officeDelivery,
          updatedAt: now,
        });
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

// Delivery Integration Functions
export const getDeliveryIntegration = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const sectionDoc = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "deliveryIntegration"))
      .first();

    const content = (sectionDoc?.content as DeliveryIntegrationContent | null) ?? null;
    const provider = getCanonicalProvider(content?.provider);
    const lastUpdatedAt = content?.lastUpdatedAt ?? sectionDoc?.updatedAt ?? null;

    if (provider === "none") {
      return {
        provider,
        hasCredentials: false,
        lastUpdatedAt,
        credentialsUpdatedAt: null,
      };
    }

    const storedCredentials = await ctx.db
      .query("deliveryCredentials")
      .withIndex("storeProvider", (q) => q.eq("storeId", args.storeId).eq("provider", provider))
      .first();

    if (!storedCredentials) {
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
          hasCredentials: true,
          lastUpdatedAt,
          credentialsUpdatedAt: null,
          fromLegacyPayload: true,
        };
      }

      return {
        provider,
        hasCredentials: false,
        lastUpdatedAt,
        credentialsUpdatedAt: null,
      };
    }

    return {
      provider,
      hasCredentials: true,
      lastUpdatedAt,
      credentialsUpdatedAt: storedCredentials.updatedAt,
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
    const provider = getCanonicalProvider(content?.provider);

    if (provider === "none") {
      return {
        provider,
        credentials: { apiKey: "", apiToken: "", apiSecret: "", accountNumber: "" },
      };
    }

    const storedCredentials = await ctx.db
      .query("deliveryCredentials")
      .withIndex("storeProvider", (q) => q.eq("storeId", args.storeId).eq("provider", provider))
      .first();

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
    const provider = getCanonicalProvider(args.provider ?? content.provider);
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

    let hasCredentials = false;

    if (provider === "none") {
      for (const row of allStoreCredentials) {
        await ctx.db.delete(row._id);
      }
    } else {
      const providerRow = allStoreCredentials.find((row) => row.provider === provider);

      for (const row of allStoreCredentials) {
        if (row.provider !== provider) {
          await ctx.db.delete(row._id);
        }
      }

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
        hasCredentials = true;
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
        hasCredentials = true;
      } else {
        hasCredentials = Boolean(providerRow);
      }
    }

    const nextContent: DeliveryIntegrationContent = {
      provider,
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

      const store = await ctx.runQuery(api.stores.getStore, {
        storeId: args.storeId,
      });

      if (!store) {
        return { success: false, message: "Store not found." };
      }

      if (store.ownerId !== identity.subject) {
        return { success: false, message: "Forbidden" };
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
  links: [
    { id: "link-shop", text: "Shop", url: "#products", isDefault: true, enabled: true },
    { id: "link-faq", text: "FAQ", url: "/", isDefault: true, enabled: true },
    { id: "link-help", text: "Help", url: "/", isDefault: true, enabled: true },
  ],
  showCart: true,
};

export const DEFAULT_HERO: HeroContent = {
  title: "متجرنا الإلكتروني",
  subtitle: "أفضل المنتجات بأسعار منافسة",
  ctaText: "تسوق الآن",
  ctaLink: "/#products",
  layout: "center",
  backgroundImage: undefined,
};

export const DEFAULT_FOOTER: FooterContent = {
  logo: undefined,
  logoStorageId: undefined,
  description: "متجرنا يوفر لك أفضل المنتجات",
  contactEmail: "",
  contactPhone: "",
  socialLinks: [],
  copyright: "جميع الحقوق محفوظة",
};

// Initialize default site content for a new store
export const initializeSiteContent = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const sections = [
      { section: "navbar", content: DEFAULT_NAVBAR },
      { section: "hero", content: DEFAULT_HERO },
      { section: "footer", content: DEFAULT_FOOTER },
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

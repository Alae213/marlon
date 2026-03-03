import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

type SiteContentSection = "navbar" | "hero" | "footer";

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
    return content;
  },
});

export const getSiteContentResolved = query({
  args: { storeId: v.id("stores"), section: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) =>
        q.eq("storeId", args.storeId).eq("section", args.section)
      )
      .first();

    if (!doc) return null;

    const content: any = doc.content;

    if (content?.logoStorageId) {
      const logoUrl = await ctx.storage.getUrl(content.logoStorageId);
      return { ...doc, content: { ...content, logoUrl } };
    }

    return doc;
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
    background: v.optional(v.union(v.literal("dark"), v.literal("light"), v.literal("transparent"))),
    textColor: v.optional(v.union(v.literal("dark"), v.literal("light"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "navbar"))
      .first();

    const now = Date.now();
    const baseContent: any = existing?.content ?? DEFAULT_NAVBAR;

    const nextContent = {
      ...baseContent,
      ...(args.background ? { background: args.background } : {}),
      ...(args.textColor ? { textColor: args.textColor } : {}),
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

    const nextNavbar: any = {
      ...(navbarDoc?.content ?? DEFAULT_NAVBAR),
      logoStorageId: args.logoStorageId,
    };

    const nextFooter: any = {
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
    const baseContent: any = existing?.content ?? DEFAULT_HERO;

    const nextContent = {
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
    const baseContent: any = existing?.content ?? DEFAULT_FOOTER;

    const nextContent = {
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

// Delivery Integration Functions
export const getDeliveryIntegration = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "deliveryIntegration"))
      .first();
    return content?.content ?? null;
  },
});

export const setDeliveryIntegration = mutation({
  args: {
    storeId: v.id("stores"),
    provider: v.optional(v.union(v.literal("zr-express"), v.literal("yalidine"), v.literal("none"))),
    apiKey: v.optional(v.string()),
    apiToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteContent")
      .withIndex("section", (q) => q.eq("storeId", args.storeId).eq("section", "deliveryIntegration"))
      .first();

    const now = Date.now();
    const content: any = existing?.content ?? { provider: "none", apiKey: "", apiToken: "" };

    const nextContent = {
      ...content,
      ...(args.provider !== undefined ? { provider: args.provider } : {}),
      ...(args.apiKey !== undefined ? { apiKey: args.apiKey } : {}),
      ...(args.apiToken !== undefined ? { apiToken: args.apiToken } : {}),
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
    provider: v.union(v.literal("zr-express"), v.literal("yalidine")),
    apiKey: v.string(),
    apiToken: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    try {
      if (args.provider === "zr-express") {
        const response = await fetch("https://api.zrexpress.dz/v1/test", {
          headers: {
            "Authorization": `Bearer ${args.apiKey}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          return { success: true, message: "اتصال ناجح بـ ZR Express" };
        }
        return { success: false, message: "فشل الاتصال بـ ZR Express" };
      } else if (args.provider === "yalidine") {
        const response = await fetch("https://api.yalidine.com/v1/test", {
          headers: {
            "X-API-Key": args.apiKey,
            "X-API-Token": args.apiToken,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          return { success: true, message: "اتصال ناجح بـ Yalidine" };
        }
        return { success: false, message: "فشل الاتصال بـ Yalidine" };
      }
      return { success: false, message: "مزود غير معروف" };
    } catch (error) {
      return { success: false, message: `خطأ في الاتصال: ${error}` };
    }
  },
});

// Default site content templates
export const DEFAULT_NAVBAR = {
  logo: null,
  logoStorageId: null,
  background: "light",
  textColor: "dark",
  links: [
    { label: "الرئيسية", href: "/" },
    { label: "المنتجات", href: "/#products" },
    { label: "تواصل معنا", href: "/#contact" },
  ],
  showCart: true,
};

export const DEFAULT_HERO = {
  title: "متجرنا الإلكتروني",
  subtitle: "أفضل المنتجات بأسعار منافسة",
  ctaText: "تسوق الآن",
  ctaLink: "/#products",
  layout: "centered",
  backgroundImage: null,
};

export const DEFAULT_FOOTER = {
  logo: null,
  logoStorageId: null,
  description: "متجرنا为您提供最好的产品",
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

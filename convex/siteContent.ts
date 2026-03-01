import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// Default site content templates
export const DEFAULT_NAVBAR = {
  logo: null,
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

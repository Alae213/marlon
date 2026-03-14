import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

// Create or update user from Clerk webhook
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (existing) {
      // Update existing user, preserve theme if set, otherwise default to 'light'
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        theme: existing.theme || "light",
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new user with default theme
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        theme: "light",
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }
  },
});

// Migration: Set default theme for existing users
export const migrateUserThemes = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    
    for (const user of users) {
      if (!user.theme) {
        await ctx.db.patch(user._id, {
          theme: "light",
          updatedAt: now,
        });
      }
    }
    
    return { migrated: users.filter(u => !u.theme).length };
  },
});

// Update user theme preference
export const updateUserTheme = mutation({
  args: {
    clerkId: v.string(),
    theme: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      // User not yet synced from Clerk webhook — theme is already saved
      // in localStorage, so this is safe to skip.
      return null;
    }

    await ctx.db.patch(user._id, {
      theme: args.theme,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Delete user (when Clerk user is deleted)
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (user) {
      await ctx.db.delete(user._id);
      return user._id;
    }
    return null;
  },
});

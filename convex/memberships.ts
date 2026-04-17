import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertStoreRole } from "./storeAccess";
import type { Doc } from "./_generated/dataModel";

const INVITE_EXPIRY_DAYS = 7;
const INVITE_EXPIRY_MS = INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const listStoreMembers = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const hasAccess =
      store.ownerId === identity.subject ||
      (store.membershipMode === "memberships_enabled" &&
        (await ctx.db
          .query("storeMemberships")
          .withIndex("storeUserStatus", (q) =>
            q.eq("storeId", args.storeId).eq("userId", identity.subject).eq("status", "active")
          )
          .first()));

    if (!hasAccess) {
      throw new Error("Forbidden");
    }

    const memberships = await ctx.db
      .query("storeMemberships")
      .withIndex("storeUserStatus", (q) => q.eq("storeId", args.storeId))
      .collect();

    return memberships
      .filter((m) => m.status === "active" || m.status === "pending_acceptance")
      .map((m) => ({
        _id: m._id,
        storeId: m.storeId,
        userId: m.userId,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
        grantedByUserId: m.grantedByUserId,
        source: m.source,
      }));
  },
});

export const getPendingInvites = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreRole(ctx, args.storeId, "owner");

    const invites = await ctx.db
      .query("storeMemberships")
      .withIndex("storeUserStatus", (q) =>
        q.eq("storeId", args.storeId).eq("userId", "").eq("status", "pending_acceptance")
      )
      .collect();

    const now = Date.now();
    const validInvites = invites.filter((invite) => {
      const expiryTime = invite.createdAt + INVITE_EXPIRY_MS;
      return now < expiryTime;
    });

    return validInvites.map((invite) => ({
      _id: invite._id,
      userId: invite.userId,
      role: invite.role,
      createdAt: invite.createdAt,
      expiresAt: invite.createdAt + INVITE_EXPIRY_MS,
    }));
  },
});

export const inviteUserToStore = mutation({
  args: {
    storeId: v.id("stores"),
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    await assertStoreRole(ctx, args.storeId, "owner");

    const existing = await ctx.db
      .query("storeMemberships")
      .withIndex("storeUserStatus", (q) =>
        q.eq("storeId", args.storeId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      if (existing.status === "active") {
        throw new Error("User is already a member");
      }
      if (existing.status === "pending_acceptance") {
        throw new Error("User already has a pending invite");
      }
      if (existing.status === "revoked") {
        await ctx.db.patch(existing._id, {
          role: args.role,
          status: "pending_acceptance",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          grantedByUserId: existing.grantedByUserId,
          source: "invite_accept",
        });
        return existing._id;
      }
    }

    const membershipId = await ctx.db.insert("storeMemberships", {
      storeId: args.storeId,
      userId: args.userId,
      role: args.role,
      status: "pending_acceptance",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      grantedByUserId: (
        await ctx.auth.getUserIdentity()
      )?.subject || "",
      source: "invite_accept",
      permissionsVersion: "v1",
    });

    return membershipId;
  },
});

export const acceptInvitation = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const allMemberships = await ctx.db
      .query("storeMemberships")
      .withIndex("userStatus", (q) =>
        q.eq("userId", identity.subject).eq("status", "pending_acceptance")
      )
      .collect();

    const membership = allMemberships.find((m) => m.storeId === args.storeId);

    if (!membership) {
      throw new Error("No pending invitation found");
    }

    const expiryTime = membership.createdAt + INVITE_EXPIRY_MS;
    if (now >= expiryTime) {
      throw new Error("Invitation has expired");
    }

    await ctx.db.patch(membership._id, {
      status: "active",
      updatedAt: now,
    });

    const store = await ctx.db.get(args.storeId);
    if (store && store.membershipMode !== "memberships_enabled") {
      await ctx.db.patch(args.storeId, {
        membershipMode: "memberships_enabled",
        updatedAt: now,
      });
    }

    return membership._id;
  },
});

export const revokeMemberAccess = mutation({
  args: {
    storeId: v.id("stores"),
    membershipId: v.id("storeMemberships"),
  },
  handler: async (ctx, args) => {
    const { store } = await assertStoreRole(ctx, args.storeId, "owner");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership || membership.storeId !== args.storeId) {
      throw new Error("Membership not found");
    }

    if (membership.role === "owner") {
      throw new Error("Cannot revoke owner access");
    }

    await ctx.db.patch(args.membershipId, {
      status: "revoked",
      revokedAt: Date.now(),
      revokedByUserId: (await ctx.auth.getUserIdentity())?.subject || "",
      updatedAt: Date.now(),
    });

    return args.membershipId;
  },
});

export const getMyStoreRoles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const memberships = await ctx.db
      .query("storeMemberships")
      .withIndex("userStatus", (q) =>
        q.eq("userId", identity.subject).eq("status", "active")
      )
      .collect();

    const storeRoles: Array<{
      storeId: string;
      storeName: string;
      storeSlug: string;
      role: "owner" | "admin" | "staff";
      accessSource: string;
      membershipId: string | null;
    }> = [];

    for (const membership of memberships) {
      const store = await ctx.db.get(membership.storeId);
      if (store) {
        storeRoles.push({
          storeId: store._id,
          storeName: store.name,
          storeSlug: store.slug,
          role: membership.role,
          accessSource: "membership",
          membershipId: membership._id,
        });
      }
    }

    const ownedStores = await ctx.db
      .query("stores")
      .withIndex("ownerId", (q) => q.eq("ownerId", identity.subject))
      .collect();

    for (const store of ownedStores) {
      const exists = storeRoles.find((sr) => sr.storeId === store._id);
      if (!exists) {
        storeRoles.push({
          storeId: store._id,
          storeName: store.name,
          storeSlug: store.slug,
          role: "owner" as const,
          accessSource: "legacy_owner",
          membershipId: null,
        });
      }
    }

    return storeRoles;
  },
});

export const getViewerAccessForStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const isOwner = store.ownerId === identity.subject;
    if (isOwner) {
      return {
        storeId: store._id,
        actorRole: "owner" as const,
        accessSource: "legacy_owner" as const,
        membershipId: null,
        identitySubject: identity.subject,
      };
    }

    if (store.membershipMode !== "memberships_enabled") {
      return null;
    }

    const membership = await ctx.db
      .query("storeMemberships")
      .withIndex("storeUserStatus", (q) =>
        q
          .eq("storeId", args.storeId)
          .eq("userId", identity.subject)
          .eq("status", "active")
      )
      .first();

    if (!membership) {
      return null;
    }

    return {
      storeId: store._id,
      actorRole: membership.role,
      accessSource: "membership" as const,
      membershipId: membership._id,
      identitySubject: identity.subject,
    };
  },
});

export const bootstrapOwnerMembership = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const existing = await ctx.db
      .query("storeMemberships")
      .withIndex("storeUserStatus", (q) =>
        q
          .eq("storeId", args.storeId)
          .eq("userId", store.ownerId)
          .eq("status", "active")
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const membershipId = await ctx.db.insert("storeMemberships", {
      storeId: args.storeId,
      userId: store.ownerId,
      role: "owner",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      grantedByUserId: store.ownerId,
      source: "owner_bootstrap",
      permissionsVersion: "v1",
    });

    await ctx.db.patch(args.storeId, {
      membershipMode: "memberships_enabled",
      updatedAt: Date.now(),
    });

    return membershipId;
  },
});

export const getMembershipMode = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    return store?.membershipMode || "owner_only";
  },
});

export const transferOwnership = mutation({
  args: {
    storeId: v.id("stores"),
    newOwnerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertStoreRole(ctx, args.storeId, "owner");

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const newOwnerMembership = await ctx.db
      .query("storeMemberships")
      .withIndex("storeUserStatus", (q) =>
        q
          .eq("storeId", args.storeId)
          .eq("userId", args.newOwnerUserId)
          .eq("status", "active")
      )
      .first();

    if (!newOwnerMembership) {
      throw new Error("New owner must be an active store member");
    }

    const now = Date.now();
    const previousOwnerId = store.ownerId;

    await ctx.db.patch(args.storeId, {
      ownerId: args.newOwnerUserId,
      updatedAt: now,
    });

    const prevOwnerMembership = await ctx.db
      .query("storeMemberships")
      .withIndex("storeUserStatus", (q) =>
        q
          .eq("storeId", args.storeId)
          .eq("userId", previousOwnerId)
          .eq("status", "active")
      )
      .first();

    if (prevOwnerMembership) {
      await ctx.db.patch(prevOwnerMembership._id, {
        role: "admin",
        updatedAt: now,
      });
    }

    await ctx.db.patch(newOwnerMembership._id, {
      role: "owner",
      updatedAt: now,
    });

    return args.storeId;
  },
});
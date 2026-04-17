import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  resolveStoreAccessRole,
  type StoreAccessSource,
  type StoreActorRole,
} from "./storeAccessLib";

type ViewerIdentity = { subject: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MembershipQuery = any;

type StoreAccessDb = {
  get: (id: Id<"stores">) => Promise<Doc<"stores"> | null>;
  query: (table: "storeMemberships") => MembershipQuery;
};

type StoreAccessCtx = {
  db: StoreAccessDb;
  auth: { getUserIdentity: () => Promise<ViewerIdentity | null> };
};

type InternalStoreAccessCtx = {
  db: StoreAccessDb;
};

export type StoreAccessResult = {
  identity: ViewerIdentity;
  store: Doc<"stores">;
  actorRole: StoreActorRole;
  accessSource: Exclude<StoreAccessSource, "internal">;
  membership: Doc<"storeMemberships"> | null;
};

async function getStoreOrThrow(ctx: { db: StoreAccessDb }, storeId: Id<"stores">) {
  const store = await ctx.db.get(storeId);
  if (!store) {
    throw new Error("Store not found");
  }
  return store;
}

async function getActiveMembership(
  ctx: { db: StoreAccessDb },
  storeId: Id<"stores">,
  userId: string,
) {
  return await ctx.db
    .query("storeMemberships")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("storeUserStatus", (q: any) =>
      q.eq("storeId", storeId).eq("userId", userId).eq("status", "active"),
    )
    .first();
}

export async function assertStoreRole(
  ctx: StoreAccessCtx,
  storeId: Id<"stores">,
  minimumRole: StoreActorRole = "owner",
): Promise<StoreAccessResult> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const store = await getStoreOrThrow(ctx, storeId);
  const membership = await getActiveMembership(ctx, storeId, identity.subject);
  const access = resolveStoreAccessRole({
    store,
    identitySubject: identity.subject,
    minimumRole,
    membership,
  });

  if (!access) {
    throw new Error("Forbidden");
  }

  return {
    identity,
    store,
    actorRole: access.actorRole,
    accessSource: access.accessSource,
    membership: access.membership,
  };
}

export async function assertInternalStorePaymentAccess(
  ctx: InternalStoreAccessCtx,
  storeId: Id<"stores">,
) {
  const store = await getStoreOrThrow(ctx, storeId);
  return {
    store,
    accessSource: "internal" as const,
  };
}

export const getViewerStoreAccess = query({
  args: {
    storeId: v.id("stores"),
    minimumRole: v.optional(
      v.union(v.literal("owner"), v.literal("admin"), v.literal("staff")),
    ),
  },
  handler: async (ctx, args) => {
    const access = await assertStoreRole(ctx, args.storeId, args.minimumRole ?? "owner");
    return {
      storeId: access.store._id,
      actorRole: access.actorRole,
      accessSource: access.accessSource,
      membershipId: access.membership?._id ?? null,
      identitySubject: access.identity.subject,
    };
  },
});

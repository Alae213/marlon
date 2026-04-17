import { describe, expect, it } from "bun:test";

import {
  resolveStoreAccessRole,
  roleMeetsRequirement,
} from "@/convex/storeAccessLib";

function makeStore(overrides = {}) {
  return {
    _id: "store_1",
    ownerId: "owner_1",
    name: "Store",
    slug: "store",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function makeMembership(overrides = {}) {
  return {
    _id: "membership_1",
    storeId: "store_1",
    userId: "user_1",
    role: "admin",
    status: "active",
    createdAt: 1,
    updatedAt: 1,
    grantedByUserId: "owner_1",
    source: "migration",
    permissionsVersion: "v1_owner_only",
    ...overrides,
  };
}

describe("store access helpers", () => {
  it("keeps legacy owner access even before memberships are enabled", () => {
    const access = resolveStoreAccessRole({
      store: makeStore({ membershipMode: "owner_only" }),
      identitySubject: "owner_1",
      minimumRole: "owner",
      membership: null,
    });

    expect(access).toEqual({
      actorRole: "owner",
      accessSource: "legacy_owner",
      membership: null,
    });
  });

  it("fails closed for admin membership while store is owner-only", () => {
    const access = resolveStoreAccessRole({
      store: makeStore({ membershipMode: "owner_only" }),
      identitySubject: "user_1",
      minimumRole: "admin",
      membership: makeMembership({ role: "admin" }),
    });

    expect(access).toBeNull();
  });

  it("allows admin membership only after memberships are enabled", () => {
    const access = resolveStoreAccessRole({
      store: makeStore({ membershipMode: "memberships_enabled" }),
      identitySubject: "user_1",
      minimumRole: "admin",
      membership: makeMembership({ role: "admin" }),
    });

    expect(access).toMatchObject({
      actorRole: "admin",
      accessSource: "membership",
    });
  });

  it("rejects staff membership for owner-level actions", () => {
    const access = resolveStoreAccessRole({
      store: makeStore({ membershipMode: "memberships_enabled" }),
      identitySubject: "user_1",
      minimumRole: "owner",
      membership: makeMembership({ role: "staff" }),
    });

    expect(access).toBeNull();
  });

  it("compares role strength explicitly", () => {
    expect(roleMeetsRequirement("owner", "admin")).toBe(true);
    expect(roleMeetsRequirement("admin", "staff")).toBe(true);
    expect(roleMeetsRequirement("staff", "admin")).toBe(false);
  });
});

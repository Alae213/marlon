import type { Doc } from "./_generated/dataModel";

export type StoreActorRole = "owner" | "admin" | "staff";
export type StoreAccessSource = "legacy_owner" | "membership" | "internal";

export type ResolvedStoreAccess = {
  actorRole: StoreActorRole;
  accessSource: Exclude<StoreAccessSource, "internal">;
  membership: Doc<"storeMemberships"> | null;
};

const ROLE_PRIORITY: Record<StoreActorRole, number> = {
  staff: 1,
  admin: 2,
  owner: 3,
};

export function roleMeetsRequirement(
  actorRole: StoreActorRole,
  minimumRole: StoreActorRole,
): boolean {
  return ROLE_PRIORITY[actorRole] >= ROLE_PRIORITY[minimumRole];
}

export function resolveStoreAccessRole(args: {
  store: Doc<"stores">;
  identitySubject: string;
  minimumRole: StoreActorRole;
  membership: Doc<"storeMemberships"> | null;
}): ResolvedStoreAccess | null {
  const { store, identitySubject, minimumRole, membership } = args;

  if (store.ownerId === identitySubject) {
    return {
      actorRole: "owner",
      accessSource: "legacy_owner",
      membership,
    };
  }

  if (store.membershipMode !== "memberships_enabled") {
    return null;
  }

  if (!membership || membership.status !== "active") {
    return null;
  }

  if (!roleMeetsRequirement(membership.role, minimumRole)) {
    return null;
  }

  return {
    actorRole: membership.role,
    accessSource: "membership",
    membership,
  };
}

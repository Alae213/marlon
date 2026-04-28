import { ConvexHttpClient } from "convex/browser";

function parseCsv(value: string | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isInternalMigrationsUiEnabled() {
  return process.env.ENABLE_INTERNAL_MIGRATIONS_UI === "true";
}

export function isInternalMigrationsOperator(userId: string | null | undefined) {
  if (!userId) return false;
  const allowlist = new Set(parseCsv(process.env.INTERNAL_MIGRATIONS_ALLOWLIST_USER_IDS));
  if (allowlist.size === 0) {
    return false;
  }
  return allowlist.has(userId);
}

export function getConvexAdminClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL.");
  }

  const adminKey = process.env.CONVEX_ADMIN_KEY;
  if (!adminKey) {
    throw new Error("Missing CONVEX_ADMIN_KEY.");
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAdminAuth(adminKey);
  return convex;
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { internal } from "@/convex/_generated/api";
import {
  getConvexAdminClient,
  isInternalMigrationsOperator,
  isInternalMigrationsUiEnabled,
} from "@/lib/internal-migrations";

type Body = {
  storeId?: unknown;
  cursor?: unknown;
  batchSize?: unknown;
};

function readString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readBatchSize(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return Math.max(1, Math.min(200, parsed));
}

export async function POST(request: Request) {
  if (!isInternalMigrationsUiEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  const authResult = await auth();
  if (!isInternalMigrationsOperator(authResult.userId)) {
    return new Response("Not Found", { status: 404 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  try {
    const convex = getConvexAdminClient();
    const result = await convex.query(internal.canonicalBillingMigrations.getCanonicalReconciliationReport, {
      storeId: readString(body.storeId) as any,
      cursor: readString(body.cursor),
      batchSize: readBatchSize(body.batchSize),
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


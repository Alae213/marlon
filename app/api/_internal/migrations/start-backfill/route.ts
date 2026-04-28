import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { internal } from "@/convex/_generated/api";
import {
  getConvexAdminClient,
  isInternalMigrationsOperator,
  isInternalMigrationsUiEnabled,
} from "@/lib/internal-migrations";

function readBatchSize(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return Math.max(1, Math.min(500, parsed));
}

export async function POST(request: Request) {
  if (!isInternalMigrationsUiEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  const authResult = await auth();
  if (!isInternalMigrationsOperator(authResult.userId)) {
    return new Response("Not Found", { status: 404 });
  }

  let body: { batchSize?: unknown } = {};
  try {
    body = (await request.json()) as { batchSize?: unknown };
  } catch {
    body = {};
  }

  try {
    const convex = getConvexAdminClient();
    const result = await convex.mutation(internal.canonicalBillingMigrations.startCanonicalScaffoldingBackfill, {
      batchSize: readBatchSize(body.batchSize),
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { internal } from "@/convex/_generated/api";
import {
  getConvexAdminClient,
  isInternalMigrationsOperator,
  isInternalMigrationsUiEnabled,
} from "@/lib/internal-migrations";

type Body = {
  cursor?: unknown;
  batchSize?: unknown;
  dryRun?: unknown;
};

function readString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readBatchSize(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return Math.max(1, Math.min(500, parsed));
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
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
    const result = await convex.mutation(internal.canonicalBillingMigrations.applyCanonicalParityFixupsBatch, {
      cursor: readString(body.cursor),
      batchSize: readBatchSize(body.batchSize),
      dryRun: readBoolean(body.dryRun),
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


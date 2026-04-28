import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { internal } from "@/convex/_generated/api";
import {
  getConvexAdminClient,
  isInternalMigrationsOperator,
  isInternalMigrationsUiEnabled,
} from "@/lib/internal-migrations";

export async function POST() {
  if (!isInternalMigrationsUiEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  const authResult = await auth();
  if (!isInternalMigrationsOperator(authResult.userId)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const convex = getConvexAdminClient();
    const result = await convex.query(internal.canonicalBillingMigrations.previewCanonicalScaffoldingState, {});
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


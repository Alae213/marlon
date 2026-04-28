import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { MigrationsDashboard } from "@/components/internal/migrations-dashboard";
import {
  isInternalMigrationsOperator,
  isInternalMigrationsUiEnabled,
} from "@/lib/internal-migrations";

export default async function InternalMigrationsPage() {
  if (!isInternalMigrationsUiEnabled()) {
    notFound();
  }

  const authResult = await auth();
  if (!isInternalMigrationsOperator(authResult.userId)) {
    notFound();
  }

  return <MigrationsDashboard />;
}


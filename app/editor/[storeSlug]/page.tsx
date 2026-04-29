"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { ProductsContent } from "@/components/pages/editor";
import { StoreBrowserBranding } from "@/components/pages/shared/store-browser-branding";

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const initialSettingsTab = searchParams.get("settings") ?? undefined;

  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip"
  );
  const navbarContent = useQuery(
    api.siteContent.getSiteContentResolved,
    store?._id ? { storeId: store._id as Id<"stores">, section: "navbar" } : "skip"
  );

  const storeId = store?._id as Id<"stores"> | undefined;
  const navbarLogoUrl = (navbarContent?.content as { logoUrl?: string } | undefined)?.logoUrl;

  if (!store && storeSlug) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[--system-gray-900]" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-[--system-gray-6] border border-[--system-gray-4] p-12 text-center">
          <p className="text-[--system-gray-600]">المتجر غير موجود</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StoreBrowserBranding title={store.name} iconUrl={navbarLogoUrl} />
      <ProductsContent storeId={storeId} storeSlug={storeSlug} initialSettingsTab={initialSettingsTab} />
    </>
  );
}

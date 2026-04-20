"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { ProductsContent } from "@/components/pages/editor";

export default function EditorPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;

  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip"
  );

  const storeId = store?._id as Id<"stores"> | undefined;

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

  return <ProductsContent storeId={storeId} storeSlug={storeSlug} />;
}

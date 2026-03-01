"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function StoreAdminPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // Redirect to products page by default
  useEffect(() => {
    router.replace(`/store/${slug}/products`);
  }, [router, slug]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00853f] mx-auto mb-4" />
        <p className="text-zinc-500">جاري التحميل...</p>
      </div>
    </div>
  );
}

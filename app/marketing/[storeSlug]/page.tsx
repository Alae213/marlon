"use client";

import { useParams } from "next/navigation";
import { BottomNavigation } from "@/components/primitives/core/layout/bottom-navigation";



export default function MarketingPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;



  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      Coming soon

      <BottomNavigation storeSlug={storeSlug} currentPage="marketing" />
    </div>
  );
}
 
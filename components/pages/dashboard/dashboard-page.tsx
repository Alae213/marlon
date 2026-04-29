"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Loader2, Plus } from "lucide-react";
import { StoreCard } from "@/components/features/shared";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { CreateStoreModal } from "./create-store-modal";

type StoreData = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  orderCount: number;
  status: string;
  subscription: string;
  paidUntil?: number;
};

function DashboardSurface({ userId }: { userId: string }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const stores = useQuery(api.stores.getUserStores, { userId });

  const storesData: StoreData[] = useMemo(
    () =>
      stores?.map((store: Doc<"stores">) => ({
        _id: store._id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        orderCount: store.orderCount || 0,
        status: store.status || "active",
        subscription: store.subscription || "trial",
        paidUntil: store.paidUntil,
      })) || [],
    [stores],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-between gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <Image src="/logo.svg" alt="Marlon Logo" width={71} height={22} />

      <div className="flex w-full flex-1 flex-wrap items-start justify-center gap-4 py-6 sm:py-10">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex h-[200px] w-full max-w-[200px] cursor-pointer flex-col items-start justify-between bg-[var(--system-100)] p-5 text-left transition-transform duration-150 active:scale-[0.96] sm:w-[200px]"
          style={{ borderRadius: "32px" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[26px] bg-[var(--system-200)]">
            <Plus className="h-5 w-5 text-[var(--system-600)]" />
          </div>

          <p className="body-base text-[var(--system-600)]">new store </p>
        </button>

        {storesData.map((store) => (
          <StoreCard
            key={store._id}
            name={store.name}
            slug={store.slug}
            subscription={store.subscription}
            paidUntil={store.paidUntil}
          />
        ))}
      </div>

      <CreateStoreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {}}
      />

      <p className="label-xs text-[var(--system-400)]">© 2026 Marlon. All rights reserved.</p>
    </div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/oboarding");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-[var(--system-600)]" />
        </div>
      </div>
    );
  }

  return (
    <RealtimeProvider userId={user.id as Id<"users">}>
      <DashboardSurface userId={user.id} />
    </RealtimeProvider>
  );
}

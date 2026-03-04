"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { 
  Plus, 
  Store, 
  ExternalLink, 
  Package,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button, Input } from "@/components/core";
import { RealtimeProvider, useRealtime } from "@/contexts/realtime-context";

// Types
interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  orderCount: number;
  status: string;
  subscription: string;
}

// Store Card Component - Displays individual store with status and basic info
function StoreCard({ store }: { store: StoreData }) {
  const getStatusBadge = () => {
    switch (store.subscription) {
      case "active":
        return <span className="text-xs text-[#16a34a]">نشط</span>;
      case "trial":
        return <span className="text-xs text-[#737373]">تجريبي</span>;
      default:
        return null;
    }
  };

  return (
    <Link href={`/editor/${store.slug}`} className="group block">
      <div className="flex flex-col items-end cursor-pointer justify-between w-[200px] h-[200px] bg-[var(--system-300)] p-[20px]"
            style={{ borderRadius: '32px' }}>

              <div className="flex items-center justify-between">
          <ExternalLink className="w-3.5 h-3.5" />
        </div>

        <h3 className="font-medium text-[var(--system-50)]">
          {store.name}
        </h3>
        
        
      </div>
    </Link>
  );
}

// Create Store Modal Component - Handles new store creation form
function CreateStoreModal({ isOpen, onClose, onSuccess }: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { user } = useUser();
  const createStore = useMutation(api.stores.createStore);
  const slugAvailable = useQuery(
    api.stores.isSlugAvailable, 
    slug ? { slug } : "skip"
  );

  const generateSlug = (inputName: string) => {
    return inputName
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(slug)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!name.trim()) {
      setError("يرجى إدخال اسم المتجر");
      return;
    }
    
    if (!slug.trim()) {
      setError("يرجى إدخال رابط المتجر");
      return;
    }
    
    if (!user) {
      setError("يرجى تسجيل الدخول أولاً");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isAvailable = await slugAvailable;
      if (!isAvailable) {
        setError("هذا الرابط مستخدم. يرجى اختيار رابط آخر");
        setIsLoading(false);
        return;
      }
      
      await createStore({
        ownerId: user.id,
        name,
        slug,
        description: "",
      });
      
      setIsLoading(false);
      onSuccess();
      onClose();
      setName("");
      setSlug("");
} catch (_err) {
      setError("حدث خطأ. يرجى المحاولة مرة أخرى");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-lg font-medium text-[#171717] dark:text-[#fafafa]">
            إنشاء متجر جديد
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717]">
            <svg className="w-5 h-5 text-[#737373]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-[#fee2e2] text-[#dc2626] text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">اسم المتجر</label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="متجري الإلكتروني" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">رابط المتجر</label>
            <div className="flex items-center gap-2">
              <span className="text-[#a3a3a3] text-sm">marlon.com/</span>
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="my-store" className="flex-1" />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">إلغاء</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري...</> : "إنشاء المتجر"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Dashboard Content Component - Main dashboard view with store list and create button
function DashboardContent() {
  const { user, isLoaded } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { isConnected } = useRealtime();

  const stores = useQuery(api.stores.getUserStores, user ? { userId: user.id } : "skip");

  const storesData: StoreData[] = stores?.map((store: Doc<"stores">) => ({
    _id: store._id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logo: store.logo,
    orderCount: store.orderCount || 0,
    status: store.status || "active",
    subscription: store.subscription || "trial",
  })) || [];

  if (!isLoaded) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#171717] mx-auto mb-4" />
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-4 h-screen justify-between items-center py-10 max-w-5xl mx-auto bg-[var(--system-50)] dark:bg-[var(--system-900)]">
      
        <Image src="/logo.svg" alt="Marlon Logo" width={71} height={22} />
      
          <SignedIn>
        <div className="flex flex-row gap-4 ">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-end cursor-pointer justify-between w-[200px] h-[200px] bg-[var(--system-100)] p-[20px]"
            style={{ borderRadius: '32px' }}
          >
            <div className="w-12 h-12 bg-[var(--system-200)] flex items-center justify-center rounded-[26px]">
              <Plus className="w-5 h-5 text-[var(--system-600)]" />
            </div>

            <p className="font-medium text-[var(--system-600)]">new store </p>

          </button>

          {storesData.map((store) => (
            <StoreCard key={store._id} store={store} />
          ))}
        </div>

      </SignedIn><CreateStoreModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { } } />

        <p className="text-[var(--system-400)]">© 2026 Marlon. All rights reserved.</p>
    </div>
    </>
  );
}

// Landing Page Component - Public landing page for unauthenticated users
function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <header className="flex items-center justify-between px-8 py-6">
        
      </header>

      <main className="flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">

          <SignedOut>
            <div className="flex flex-col items-center gap-4">
              <SignInButton mode="modal">
                <button className="flex items-center justify-center gap-3 w-full max-w-xs h-12 bg-[#171717] dark:bg-[#fafafa] text-white dark:text-[#171717] font-normal text-base transition-all duration-300 hover:opacity-80">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  </svg>
                  تسجيل الدخول عبر جوجل
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-sm text-[#a3a3a3]">© 2026 Marlon. جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

// Main Page Component - Root page with authentication and dashboard
export default function HomePage() {
  const { user, isLoaded } = useUser();
  
  return (
    <RealtimeProvider userId={user?.id as Id<"users">}>
      <SignedIn>
        <DashboardContent />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </RealtimeProvider>
  );
}

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
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] p-8 hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-300">
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center">
{store.logo ? (
              <div className="relative w-8 h-8">
                <Image src={store.logo} alt={store.name} fill className="object-cover" />
              </div>
            ) : (
              <Store className="w-5 h-5 text-[#171717] dark:text-[#fafafa]" />
            )}
          </div>
          {getStatusBadge()}
        </div>
        
        <h3 className="font-medium text-[#171717] dark:text-[#fafafa] mb-2 group-hover:text-[#525252] dark:group-hover:text-[#d4d4d4] transition-colors">
          {store.name}
        </h3>
        
        <p className="text-sm text-[#737373] mb-6 line-clamp-2">
          {store.description || "لا يوجد وصف"}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#a3a3a3]">
            {store.orderCount} طلب
          </span>
          <span className="flex items-center gap-1 text-sm text-[#171717] dark:text-[#fafafa] font-medium">
            فتح المتجر
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-2xl font-normal text-[#171717] dark:text-[#fafafa]">متاجرتي</h1>
          <p className="text-[#737373] mt-2">إدارة جميع متاجرك في مكان واحد</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#16a34a]" />
                <span className="text-sm text-[#737373]">متصل</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-[#a3a3a3]" />
                <span className="text-sm text-[#a3a3a3]">غير متصل</span>
              </div>
            )}
          </div>
          
          <SignedIn>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4" />
                متجر جديد
              </Button>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            </div>
          </SignedIn>
        </div>
      </div>

      <SignedIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group flex flex-col items-center justify-center min-h-[200px] border border-dashed border-[#e5e5e5] dark:border-[#404040] hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-300 cursor-pointer bg-transparent"
          >
            <div className="w-12 h-12 bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
              <Plus className="w-5 h-5 text-[#171717] dark:text-[#fafafa]" />
            </div>
            <p className="font-medium text-[#171717] dark:text-[#fafafa]">متجر جديد</p>
            <p className="text-sm text-[#737373] mt-1">أنشئ متجرك الأول</p>
          </button>

          {storesData.map((store) => (
            <StoreCard key={store._id} store={store} />
          ))}
        </div>

        {storesData.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-[#d4d4d4] mx-auto mb-4" />
            <p className="text-[#737373]">لا توجد متاجر بعد. أنشئ متجرك الأول!</p>
          </div>
        )}
      </SignedIn>

      <CreateStoreModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => {}} />
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <header className="flex items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-[#171717] dark:bg-[#fafafa] flex items-center justify-center">
            <span className="text-white dark:text-[#171717] font-medium text-base">م</span>
          </div>
          <span className="text-base font-normal text-[#171717] dark:text-[#fafafa]">مارلون</span>
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-normal text-[#171717] dark:text-[#fafafa] mb-6 leading-tight">
              أنشئ متجرك الإلكتروني
              <span className="block text-[#525252] dark:text-[#a3a3a3]">في دقائق</span>
            </h1>
            <p className="text-base text-[#525252] dark:text-[#a3a3a3] max-w-md mx-auto leading-relaxed">
              منصة تجارة إلكترونية للموزعين الجزائريين. أنشئ متجرك وابدأ البيع الآن بدون تكاليف شهرية
            </p>
          </div>

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

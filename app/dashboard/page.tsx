"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Plus, 
  Store, 
  ExternalLink, 
  Settings, 
  Package,
  X,
  Loader2,
  Wifi,
  WifiOff,
  Bell
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
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            نشط
          </span>
        );
      case "trial":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            تجريبي
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:border-[#00853f]/30 transition-all duration-300">
      <Link href={`/store/${store.slug}`} className="block p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#00853f]/10 flex items-center justify-center">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <Store className="w-7 h-7 text-[#00853f]" />
            )}
          </div>
          {getStatusBadge()}
        </div>
        
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-[#00853f] transition-colors">
          {store.name}
        </h3>
        
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">
          {store.description || "لا يوجد وصف"}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">
            {store.orderCount} طلب
          </span>
          <span className="flex items-center gap-1 text-[#00853f] font-medium">
            فتح المتجر
            <ExternalLink className="w-4 h-4" />
          </span>
        </div>
      </Link>
      
      <div className="absolute top-4 end-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link 
          href={`/store/${store.slug}/settings`}
          className="p-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <Settings className="w-4 h-4 text-zinc-500" />
        </Link>
      </div>
    </div>
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
    
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
      setError("الرابط يجب أن يكون أحرف إنجليزية وأرقام وشرطات فقط");
      return;
    }
    
    if (!user) {
      setError("يرجى تسجيل الدخول أولاً");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if slug is available
      const isAvailable = await slugAvailable;
      if (!isAvailable) {
        setError("هذا الرابط مستخدم من قبل. يرجى اختيار رابط آخر");
        setIsLoading(false);
        return;
      }
      
      // Create store in Convex
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
    } catch (err) {
      setError("حدث خطأ أثناء إنشاء المتجر. يرجى المحاولة مرة أخرى");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            إنشاء متجر جديد
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              اسم المتجر
            </label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="متجري الإلكتروني"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              رابط المتجر
            </label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400 text-sm">marlon.com/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="my-store"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              هذا الرابط سيُستخدم للوصول إلى متجرك
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء المتجر"
              )}
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
  const { isConnected, newOrdersCount, newNotifications } = useRealtime();

  // Get user stores from Convex
  const stores = useQuery(
    api.stores.getUserStores,
    user ? { userId: user.id } : "skip"
  );

  // Convert Convex stores to StoreData format
  const storesData: StoreData[] = stores?.map((store: any) => ({
    _id: store._id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logo: store.logo,
    orderCount: store.orderCount || 0,
    status: store.status || "active",
    subscription: store.subscription || "trial",
  })) || [];

  const handleCreateStore = () => {
    // Store will be automatically updated via Convex subscription
  };

  if (!isLoaded) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00853f] mx-auto mb-4" />
          <p className="text-zinc-500">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            متاجرتي
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            إدارة جميع متاجرك في مكان واحد
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Real-time connection status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">متصل</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">غير متصل</span>
              </>
            )}
          </div>
          
          {/* Notifications */}
          {newNotifications.length > 0 && (
            <div className="relative">
              <div className="absolute -top-1 -end-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          )}
          
          <SignedIn>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-5 h-5" />
                متجر جديد
              </Button>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 rounded-xl"
                  }
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>

      <SignedOut>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="w-16 h-16 bg-[#00853f]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-[#00853f]" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            مرحباً بك في مارلون
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            سجل دخولك لإنشاء وإدارة متاجرك الإلكترونية
          </p>
          <SignInButton mode="modal">
            <Button>
              تسجيل الدخول
            </Button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Store Card */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative flex flex-col items-center justify-center min-h-[200px] rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-[#00853f] hover:bg-[#00853f]/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#00853f]/10 flex items-center justify-center group-hover:bg-[#00853f] group-hover:scale-110 transition-all duration-300 mb-4">
              <Plus className="w-7 h-7 text-[#00853f] group-hover:text-white transition-colors duration-300" />
            </div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-[#00853f] transition-colors">
              متجر جديد
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              أنشئ متجرك الأول
            </p>
          </button>

          {/* Store Cards */}
          {storesData.map((store) => (
            <StoreCard key={store._id} store={store} />
          ))}
        </div>

        {storesData.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400">
              لا توجد متاجر بعد. أنشئ متجرك الأول!
            </p>
          </div>
        )}
      </SignedIn>

      <CreateStoreModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateStore}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  
  return (
    <RealtimeProvider userId={user?.id}>
      <DashboardContent />
    </RealtimeProvider>
  );
}

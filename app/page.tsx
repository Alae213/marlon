"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
import { AnimatePresence } from 'motion/react';
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from "@/components/animate-ui/primitives/radix/dialog";

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
        return <span className="text-xs text-[#16a34a]">Active</span>;
      case "trial":
        return <span className="text-xs text-[#737373]">Trial</span>;
      default:
        return null;
    }
  };

  return (
    <Link href={`/editor/${store.slug}`} className="group block">
      <div className="flex flex-col items-start cursor-pointer justify-between w-[200px] h-[200px] bg-[var(--system-300)] p-[20px]"
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
      setError("Please enter a store name");
      return;
    }
    
    if (!slug.trim()) {
      setError("Please enter a store URL");
      return;
    }
    
    if (!user) {
      setError("Please login first");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isAvailable = await slugAvailable;
      if (!isAvailable) {
        setError("This URL is already taken. Please choose another one");
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
      setError("An error occurred. Please try again");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <DialogContent
            style={{ 
              boxShadow: "var(--shadow-xl-shadow)",
            } as any}
            className="w-[380px] bg-[--system-100] [corner-shape:squircle] rounded-[64px] overflow-hidden bg-[image:var(--gradient-popup)] p-[20px] flex flex-col gap-[12px] shadow-[var(--shadow-xl-shadow)] items-start "
            from="top"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <DialogHeader className="flex flex-row justify-between w-full">
              <button onClick={onClose} className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717]">
                <X className="w-5 h-5 text-[#737373]" />
              </button>
              <DialogTitle className="headline-2xl text-white" style={{ direction: 'ltr' }}>
                This is what people
                <br />
                will see.
              </DialogTitle>
            </DialogHeader>
        
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && <div className="p-3 bg-[#fee2e2] text-[#dc2626] text-sm">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">Store Name</label>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="My Online Store" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">Store URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-[#a3a3a3] text-sm">marlon.com/</span>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="my-store" className="flex-1" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Store"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
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
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#171717] mx-auto mb-4" />
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-4 h-screen justify-between items-center py-10 w-full mx-auto bg-[var(--system-50)] dark:bg-[var(--system-900)]">
      
        <Image src="/logo.svg" alt="Marlon Logo" width={71} height={22} />
      
          <SignedIn>
        <div className="flex flex-row gap-4 ">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-col items-start cursor-pointer justify-between w-[200px] h-[200px] bg-[var(--system-100)] p-[20px]"
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
                  Sign in with Google
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-sm text-[#a3a3a3]">© 2026 Marlon. All rights reserved.</p>
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

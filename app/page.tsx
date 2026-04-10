"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { 
  Plus, 
  ExternalLink, 
  Loader2,
} from "lucide-react";
import { Button } from "@/components/primitives/core/buttons/button";
import { Input } from "@/components/primitives/core/inputs/input";
import { RealtimeProvider, useRealtime } from "@/contexts/realtime-context";
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from "@/components/primitives/animate-ui/primitives/radix/dialog";

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
      <div className="flex flex-col items-start cursor-pointer justify-between w-[200px] h-[200px] bg-[var(--system-300)] p-[20px] active:scale-[0.96] transition-transform duration-150"
            style={{ borderRadius: '32px' }}>

            <div className="flex items-center justify-between">
          <span className="w-9 h-9 flex items-center justify-center -m-2">
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const { user } = useUser();
  const createStore = useMutation(api.stores.createStore);
  const slugAvailable = useQuery(
    api.stores.isSlugAvailable, 
    slug ? { slug } : "skip"
  );

  const validateSlug = (inputSlug: string) => {
    if (!inputSlug) return { valid: false, message: 'URL is required' };
    if (inputSlug.length < 3) return { valid: false, message: 'URL must be at least 3 characters' };
    if (inputSlug.length > 50) return { valid: false, message: 'URL must be less than 50 characters' };
    if (!/^[a-z0-9-]+$/.test(inputSlug)) return { valid: false, message: 'URL can only contain lowercase letters, numbers, and hyphens' };
    return { valid: true, message: '' };
  };

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
    if (hasSubmitted) setError("");
  };

  const handleCreate = async () => {
    setError("");
    setHasSubmitted(true);
    setIsCreating(true);
    
    if (!name.trim()) {
      setError("Please enter a store name");
      setIsCreating(false);
      return;
    }
    
    if (!slug.trim()) {
      setError("Please enter a store URL");
      setIsCreating(false);
      return;
    }
    
    if (!user) {
      setError("Please login first");
      setIsCreating(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isAvailable = await slugAvailable;
      if (!isAvailable) {
        setError("This URL is already taken. Please choose another one");
        setIsCreating(false);
        setIsLoading(false);
        return;
      }
      
      await createStore({
        name,
        slug,
        description: "",
      });
      
      setIsCreating(false);
      setIsLoading(false);
      onSuccess();
      onClose();
      setName("");
      setSlug("");
    } catch (_err) {
      setError("An error occurred. Please try again");
      setIsCreating(false);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/0" />
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <DialogContent
            style={{ 
              boxShadow: "var(--bottom-nav-shadow)",
            } as React.CSSProperties}
            className="w-[360px] bg-[--system-100] [corner-shape:squircle] rounded-[64px] overflow-hidden bg-[image:var(--gradient-popup)] p-[20px] flex flex-col gap-[12px]  items-start backdrop-blur-[12px]"
            from="top"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <DialogHeader className="flex flex-row justify-between w-full h-[58px]">
              <DialogTitle className="headline-2xl text-white">
                This is what people
                <br />
                will see.
              </DialogTitle>
              <div 
                onClick={onClose} 
                className="w-10 h-10 -m-2 flex items-center justify-center cursor-pointer rounded-full hover:bg-white/10 transition-colors duration-150 active:scale-[0.96]"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z" fill="white" fillOpacity="0.35"/>
                </svg>
              </div>
            </DialogHeader>


              <hr className="h-px w-full border-0 rounded-full "
                      style={{
                        background: "rgba(242, 242, 242, 0.30)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.30)",
                      }}/>

                      <p className="text-[var(--system-300)] body-base">
                        you can change it late
                        </p>
                      
                  <div
                    style={{ boxShadow: "var(--shadow-shadow)" }}
                    className="flex flex-col gap-[11px] p-[12px] rounded-[22px] bg-white/10 overflow-visible"
                  >
                    <div className="flex flex-row gap-4 items-center w-full h-[27px]">
                      
                        <Image src="/windw.svg" alt="Website" width={33} height={9} />
                        <div className="flex flex-row gap-2 items-center w-full">
                          <Image src="/favicon.svg" alt="Marlon" width={27} height={34} />
                        
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            handleNameChange(e.target.value);
                            if (hasSubmitted) setError("");
                          }}
                          placeholder="Type . . ."
                          className={`w-full px-[4px] rounded-[10px] h-[32px] bg-transparent border ${hasSubmitted && !name ? 'border-red-500' : 'border-white/0'} text-[var(--system-100)] placeholder-[var(--system-300)] body-base py-[4px] transition-colors duration-300 ease-in-out focus:outline-none hover:bg-white/10 focus:bg-white/5`}
                          autoFocus
                          aria-label="Website name"
                        />  
                        </div>
                    </div>

                    <div className="h-[32px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--system-200)] body-base">
                          marlon.app/
                        </span>
                        <div className="relative w-full">
                          <Input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                              const newSlug = e.target.value.toLowerCase();
                              setSlug(newSlug);
                              if (hasSubmitted) {
                                const validation = validateSlug(newSlug);
                                setError(validation.valid ? '' : validation.message || '');
                              } else {
                                setError('');
                              }
                            }}
                            className={`px-3 py-2 h-[32px] bg-black/30 ${hasSubmitted && (error || !slug) ? 'border-red-500' : 'border-white/0'}`}
                            placeholder="my-website"
                          />
                          {slug && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              {validateSlug(slug).valid ? (
                                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[10px] text-red-200 text-sm flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium">Please fix the following:</p>
                          <p>{error}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-6"></div>

                  <div className="flex gap-3 w-full">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={onClose}
                      className=" w-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={isCreating}
                      size="md"
                      className="w-full"
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </Button>
                  </div>
                  
                
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

// Agency Mode Modal - Shown when user tries to create a second store
function AgencyModeModal({ isOpen, onClose }: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/0" />
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <DialogContent
            style={{ 
              boxShadow: "var(--bottom-nav-shadow)",
            } as React.CSSProperties}
            className="w-[360px] bg-[--system-100] [corner-shape:squircle] rounded-[64px] overflow-hidden bg-[image:var(--gradient-popup)] p-[20px] flex flex-col gap-[12px] items-start backdrop-blur-[12px]"
            from="top"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <DialogHeader className="flex flex-row justify-between w-full h-[58px]">
              <DialogTitle className="headline-2xl text-white">
                Agency Mode
              </DialogTitle>
              <div 
                onClick={onClose} 
                className="w-10 h-10 -m-2 flex items-center justify-center cursor-pointer rounded-full hover:bg-white/10 transition-colors duration-150 active:scale-[0.96]"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z" fill="white" fillOpacity="0.35"/>
                </svg>
              </div>
            </DialogHeader>

            <hr className="h-px w-full border-0 rounded-full "
              style={{
                background: "rgba(242, 242, 242, 0.30)",
                boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.30)",
              }}/>

            <p className="text-[var(--system-300)] body-base">
              You already have a store. To manage multiple stores, you need to apply for Agency Mode.
            </p>

            <div className="h-6"></div>

            <div className="flex gap-3 w-full">
              <Button
                variant="ghost"
                size="md"
                onClick={onClose}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                disabled
                size="md"
                className="w-full opacity-50 cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </div>

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
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
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

  const handleNewStoreClick = () => {
    if (storesData.length >= 1) {
      setIsAgencyModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="bg-white p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--system-600)] mx-auto mb-4" />
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-4 h-screen justify-between items-center py-10 w-full mx-auto bg-[var(--system-50)]">
      
        <Image src="/logo.svg" alt="Marlon Logo" width={71} height={22} />
      
          <SignedIn>
        <div className="flex flex-row gap-4 ">
          <button
            onClick={handleNewStoreClick}
            className="flex flex-col items-start cursor-pointer justify-between w-[200px] h-[200px] bg-[var(--system-100)] p-[20px] active:scale-[0.96] transition-transform duration-150"
            style={{ borderRadius: '32px' }}
          >
            <div className="w-12 h-12 bg-[var(--system-200)] flex items-center justify-center rounded-[26px]">
              <Plus className="w-5 h-5 text-[var(--system-600)]" />
            </div>

            <p className="body-base text-[var(--system-600)]">new store </p>

          </button>

          {storesData.map((store) => (
            <StoreCard key={store._id} store={store} />
          ))}
        </div>

      </SignedIn><CreateStoreModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { } } />
      <AgencyModeModal isOpen={isAgencyModalOpen} onClose={() => setIsAgencyModalOpen(false)} />

        <p className="label-xs text-[var(--system-400)]">© 2026 Marlon. All rights reserved.</p>
    </div>
    </>
  );
}

// Landing Page Component - Public landing page for unauthenticated users
function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-8 py-6">
        
      </header>

      <main className="flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">

          <SignedOut>
            <div className="flex flex-col items-center gap-4">
              <SignInButton mode="modal">
                <Button className="flex items-center justify-center gap-3 w-full max-w-xs h-12">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="label-xs text-[var(--system-300)]">© 2026 Marlon. All rights reserved.</p>
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

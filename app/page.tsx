"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, SignUp, SignedIn, SignedOut } from "@clerk/nextjs";
import { track } from "@vercel/analytics/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { 
  Plus, 
  ExternalLink, 
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

type SellingStage = "already_online" | "dm_orders" | "pre_launch" | "exploring";
type HeardFrom = "tiktok_instagram" | "youtube_podcasts" | "friend" | "events_linkedin";
type Bottleneck = "confirmation" | "customer_details" | "delivery_handoff" | "status_tracking";
type ExpectedDailyOrders = "0_5" | "6_20" | "21_50" | "50_plus";

type PreSignupAnswers = {
  sellingStage: SellingStage | null;
  heardFrom: HeardFrom[];
  bottlenecks: Bottleneck[];
  expectedDailyOrders: ExpectedDailyOrders | null;
};

type QuestionId = keyof PreSignupAnswers;

type PreSignupOptionValue = SellingStage | HeardFrom | Bottleneck | ExpectedDailyOrders;

type PreSignupQuestion = {
  id: QuestionId;
  title: string;
  multiple: boolean;
  options: Array<{
    label: string;
    value: PreSignupOptionValue;
  }>;
};

type StoredPreSignupState = {
  step: number;
  completed: boolean;
  answers: PreSignupAnswers;
  expiresAt: number;
};

const PRE_SIGNUP_STORAGE_KEY = "marlon-pre-signup";
const PRE_SIGNUP_STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const emptyPreSignupAnswers: PreSignupAnswers = {
  sellingStage: null,
  heardFrom: [],
  bottlenecks: [],
  expectedDailyOrders: null,
};

const preSignupQuestions: PreSignupQuestion[] = [
  {
    id: "sellingStage",
    title: "Where are you with selling right now? 🛍️",
    multiple: false,
    options: [
      { label: "I already sell online", value: "already_online" },
      { label: "I take orders in DMs", value: "dm_orders" },
      { label: "I'm preparing to launch", value: "pre_launch" },
      { label: "Just exploring for now", value: "exploring" },
    ],
  },
  {
    id: "heardFrom",
    title: "So, where did you hear about me? 👀",
    multiple: true,
    options: [
      { label: "TikTok / Instagram Reels", value: "tiktok_instagram" },
      { label: "YouTube / Podcasts", value: "youtube_podcasts" },
      { label: "A friend told me", value: "friend" },
      { label: "Events / LinkedIn", value: "events_linkedin" },
    ],
  },
  {
    id: "bottlenecks",
    title: "What gets messy after someone says \"I want it\"? 😅",
    multiple: true,
    options: [
      { label: "Confirming the order", value: "confirmation" },
      { label: "Getting phone + address details", value: "customer_details" },
      { label: "Sending it to delivery", value: "delivery_handoff" },
      { label: "Tracking who paid / delivered / cancelled", value: "status_tracking" },
    ],
  },
  {
    id: "expectedDailyOrders",
    title: "On a good day, how many COD orders could you get? 📦",
    multiple: false,
    options: [
      { label: "0-5", value: "0_5" },
      { label: "6-20", value: "6_20" },
      { label: "21-50", value: "21_50" },
      { label: "50+", value: "50_plus" },
    ],
  },
];

const isPreSignupAnswers = (value: unknown): value is PreSignupAnswers => {
  if (!value || typeof value !== "object") return false;
  const answers = value as Partial<PreSignupAnswers>;
  return (
    (answers.sellingStage === null || typeof answers.sellingStage === "string") &&
    Array.isArray(answers.heardFrom) &&
    Array.isArray(answers.bottlenecks) &&
    (answers.expectedDailyOrders === null || typeof answers.expectedDailyOrders === "string")
  );
};

const safeTrack = (eventName: string, properties: Record<string, string | number | boolean>) => {
  try {
    track(eventName, properties);
  } catch {
    // Analytics must never block onboarding.
  }
};

const getDefaultPreSignupState = (): StoredPreSignupState => ({
  step: 0,
  completed: false,
  answers: emptyPreSignupAnswers,
  expiresAt: 0,
});

const readStoredPreSignupState = (): StoredPreSignupState => {
  if (typeof window === "undefined") return getDefaultPreSignupState();

  try {
    const stored = window.localStorage.getItem(PRE_SIGNUP_STORAGE_KEY);
    if (!stored) return getDefaultPreSignupState();

    const parsed = JSON.parse(stored) as Partial<StoredPreSignupState>;
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(PRE_SIGNUP_STORAGE_KEY);
      return getDefaultPreSignupState();
    }

    if (!isPreSignupAnswers(parsed.answers)) return getDefaultPreSignupState();

    return {
      answers: parsed.answers,
      completed: !!parsed.completed,
      expiresAt: parsed.expiresAt,
      step:
        typeof parsed.step === "number"
          ? Math.min(Math.max(parsed.step, 0), preSignupQuestions.length - 1)
          : 0,
    };
  } catch {
    window.localStorage.removeItem(PRE_SIGNUP_STORAGE_KEY);
    return getDefaultPreSignupState();
  }
};

const getSelectedValues = (
  answers: PreSignupAnswers,
  question: PreSignupQuestion
): PreSignupOptionValue[] => {
  switch (question.id) {
    case "sellingStage":
      return answers.sellingStage ? [answers.sellingStage] : [];
    case "heardFrom":
      return answers.heardFrom;
    case "bottlenecks":
      return answers.bottlenecks;
    case "expectedDailyOrders":
      return answers.expectedDailyOrders ? [answers.expectedDailyOrders] : [];
  }
};

// Store Card Component - Displays individual store with status and basic info
function StoreCard({ store }: { store: StoreData }) {
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
    
    try {
      const isAvailable = await slugAvailable;
      if (!isAvailable) {
        setError("This URL is already taken. Please choose another one");
        setIsCreating(false);
        return;
      }
      
      await createStore({
        name,
        slug,
        description: "",
      });
      
      setIsCreating(false);
      onSuccess();
      onClose();
      setName("");
      setSlug("");
    } catch {
      setError("An error occurred. Please try again");
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/0"
        style={{
          boxShadow: "var(--bottom-nav-shadow)",
        } as React.CSSProperties}
        className="max-w-[360px] gap-[12px] overflow-hidden rounded-[64px] border-white/10 bg-[--system-100] bg-[image:var(--gradient-popup)] p-[20px] text-white backdrop-blur-[12px] [corner-shape:squircle]"
      >
        <DialogHeader className="flex h-[58px] flex-row justify-between">
          <DialogTitle className="title-xl text-white">
            This is what people
            <br />
            will see.
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 -m-2 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10 active:scale-[0.96]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z" fill="white" fillOpacity="0.35"/>
            </svg>
          </button>
        </DialogHeader>

        <hr className="h-px w-full rounded-full border-0" style={{ background: "rgba(242, 242, 242, 0.30)", boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.30)" }} />

        <p className="body-base text-[var(--system-300)]">you can change it late</p>

        <div style={{ boxShadow: "var(--shadow-shadow)" }} className="flex flex-col gap-[11px] overflow-visible rounded-[22px] bg-white/10 p-[12px]">
          <div className="flex h-[27px] w-full flex-row items-center gap-4">
            <Image src="/windw.svg" alt="Website" width={33} height={9} />
            <div className="flex w-full flex-row items-center gap-2">
              <Image src="/favicon.svg" alt="Marlon" width={27} height={34} />

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  handleNameChange(e.target.value);
                  if (hasSubmitted) setError("");
                }}
                placeholder="Type . . ."
                className={`body-base h-[32px] w-full rounded-[10px] border bg-transparent px-[4px] py-[4px] text-[var(--system-100)] placeholder-[var(--system-300)] transition-colors duration-300 ease-in-out focus:outline-none hover:bg-white/10 focus:bg-white/5 ${hasSubmitted && !name ? "border-red-500" : "border-white/0"}`}
                autoFocus
                aria-label="Website name"
              />
            </div>
          </div>

          <div className="h-[32px]">
            <div className="flex items-center gap-2">
              <span className="body-base text-[var(--system-200)]">marlon.app/</span>
              <div className="relative w-full">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    const newSlug = e.target.value.toLowerCase();
                    setSlug(newSlug);
                    if (hasSubmitted) {
                      const validation = validateSlug(newSlug);
                      setError(validation.valid ? "" : validation.message || "");
                    } else {
                      setError("");
                    }
                  }}
                  className={`h-[32px] bg-black/30 px-3 py-2 ${hasSubmitted && (error || !slug) ? "border-red-500" : "border-white/0"}`}
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
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Please fix the following:</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="h-6" />

        <div className="flex w-full gap-3">
          <Button variant="ghost" size="md" onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} size="md" className="w-full">
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Dashboard Content Component - Main dashboard view with store list and create button
function DashboardContent() {
  const { user, isLoaded } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    setIsCreateModalOpen(true);
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

        <p className="label-xs text-[var(--system-400)]">© 2026 Marlon. All rights reserved.</p>
    </div>
    </>
  );
}

function NewStorePreview({ isSignUpOpen, onContinue }: {
  isSignUpOpen: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-between bg-[var(--system-50)] px-4 py-10">
      <Image src="/logo.svg" alt="Marlon Logo" width={71} height={22} />

      <div
        aria-hidden={isSignUpOpen}
        className={`flex flex-col items-center gap-6 transition-opacity duration-200 ${isSignUpOpen ? "pointer-events-none select-none opacity-70" : ""}`}
      >
        <button
          type="button"
          onClick={onContinue}
          className="flex h-[200px] w-[200px] cursor-pointer flex-col items-start justify-between bg-[var(--system-100)] p-[20px] text-left transition-transform duration-150 active:scale-[0.96]"
          style={{ borderRadius: "32px" }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[26px] bg-[var(--system-200)]">
            <Plus className="h-5 w-5 text-[var(--system-600)]" />
          </div>

          <p className="body-base text-[var(--system-600)]">new store </p>
        </button>

        {!isSignUpOpen && (
          <Button
            type="button"
            size="lg"
            onClick={onContinue}
            className="h-12 min-w-[220px]"
          >
            Continue with Google
          </Button>
        )}
      </div>

      <p className="label-xs text-[var(--system-400)]">© 2026 Marlon. All rights reserved.</p>
    </div>
  );
}

function PreSignupQuestionScreen({
  answers,
  currentStep,
  onBack,
  onNext,
  onSelect,
}: {
  answers: PreSignupAnswers;
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  onSelect: (question: PreSignupQuestion, value: PreSignupOptionValue) => void;
}) {
  const question = preSignupQuestions[currentStep];
  const progress = ((currentStep + 1) / preSignupQuestions.length) * 100;
  const selectedValues = getSelectedValues(answers, question);
  const canContinue = selectedValues.length > 0;

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--system-50)] px-4 py-6">
      <section className="flex w-full max-w-[520px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Image src="/logo.svg" alt="Marlon Logo" width={71} height={22} />
            <span className="label-xs text-[var(--system-400)]">
              {currentStep + 1} / {preSignupQuestions.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--system-200)]">
            <div
              className="h-full rounded-full bg-[var(--system-700)] transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="label-xs text-[var(--system-400)]">
              {question.multiple ? "Choose all that fit" : "Choose one"}
            </p>
            <h1 className="text-title text-[var(--system-700)]">
              {question.title}
            </h1>
          </div>

          <div className="grid gap-3">
            {question.options.map((option) => {
              const isSelected = selectedValues.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(question, option.value)}
                  className={`flex min-h-[56px] w-full items-center justify-between rounded-[18px] border p-4 text-left text-body text-[var(--system-700)] transition-all duration-150 active:scale-[0.99] ${
                    isSelected
                      ? "border-[var(--system-700)] bg-[var(--system-700)] text-[var(--system-50)] shadow-[var(--shadow-md)]"
                      : "border-[var(--system-200)] bg-white hover:border-[var(--system-300)] hover:bg-[var(--system-100)]"
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-white/30 bg-white text-[var(--system-700)]"
                        : "border-[var(--system-300)] bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onBack}
              className="h-12 flex-1"
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            onClick={onNext}
            disabled={!canContinue}
            className="h-12 flex-1"
          >
            Next
          </Button>
        </div>
      </section>
    </main>
  );
}

// Landing Page Component - Public landing page for unauthenticated users
function LandingPage() {
  const [preSignupState, setPreSignupState] = useState<StoredPreSignupState>(readStoredPreSignupState);
  const [isSignUpOpen, setIsSignUpOpen] = useState(preSignupState.completed);
  const { answers, completed: showPreview, step: currentStep } = preSignupState;

  useEffect(() => {
    try {
      const stateToStore: StoredPreSignupState = {
        ...preSignupState,
        expiresAt: Date.now() + PRE_SIGNUP_STORAGE_TTL_MS,
      };
      window.localStorage.setItem(PRE_SIGNUP_STORAGE_KEY, JSON.stringify(stateToStore));
    } catch {
      // Local persistence is helpful, not required.
    }
  }, [preSignupState]);

  const handleSelect = (question: PreSignupQuestion, value: PreSignupOptionValue) => {
    setPreSignupState((previousState) => {
      const previousAnswers = previousState.answers;

      if (question.multiple) {
        const key = question.id as "heardFrom" | "bottlenecks";
        const selectedValues = previousAnswers[key] as PreSignupOptionValue[];
        const isSelected = selectedValues.includes(value);

        return {
          ...previousState,
          answers: {
            ...previousAnswers,
            [key]: isSelected
              ? selectedValues.filter((selectedValue) => selectedValue !== value)
              : [...selectedValues, value],
          },
        };
      }

      return {
        ...previousState,
        answers: {
          ...previousAnswers,
          [question.id]: value,
        },
      };
    });
  };

  const handleBack = () => {
    setPreSignupState((previousState) => ({
      ...previousState,
      step: Math.max(previousState.step - 1, 0),
    }));
  };

  const handleNext = () => {
    const question = preSignupQuestions[currentStep];
    const selectedValues = getSelectedValues(answers, question);

    if (selectedValues.length === 0) return;

    safeTrack("pre_signup_step_completed", {
      step: currentStep + 1,
      question: question.id,
      selectionCount: selectedValues.length,
    });

    selectedValues.forEach((selectedValue) => {
      safeTrack("pre_signup_option_selected", {
        step: currentStep + 1,
        question: question.id,
        option: selectedValue,
      });
    });

    if (currentStep === preSignupQuestions.length - 1) {
      setPreSignupState((previousState) => ({
        ...previousState,
        completed: true,
      }));
      setIsSignUpOpen(true);
      safeTrack("pre_signup_completed", {
        questionCount: preSignupQuestions.length,
      });
      return;
    }

    setPreSignupState((previousState) => ({
      ...previousState,
      step: Math.min(previousState.step + 1, preSignupQuestions.length - 1),
    }));
  };

  if (showPreview) {
    return (
      <>
        <NewStorePreview
          isSignUpOpen={isSignUpOpen}
          onContinue={() => setIsSignUpOpen(true)}
        />

        <Dialog open={isSignUpOpen} onOpenChange={setIsSignUpOpen}>
          <DialogContent
            className="max-w-[440px] border-0 bg-transparent p-0 shadow-none"
            closeClassName="right-3 top-3 bg-white/92 text-[--system-500] shadow-[var(--shadow-md)] hover:bg-white hover:text-[--system-700]"
          >
            <SignUp routing="virtual" fallbackRedirectUrl="/" />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <PreSignupQuestionScreen
      answers={answers}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      onSelect={handleSelect}
    />
  );
}

// Main Page Component - Root page with authentication and dashboard
export default function HomePage() {
  const { user } = useUser();
  
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

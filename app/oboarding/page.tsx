"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { OnboardingFlow } from "@/components/pages/onboarding/onboarding-flow";

export default function OboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--system-50)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--system-600)]" />
      </div>
    );
  }

  return <OnboardingFlow />;
}

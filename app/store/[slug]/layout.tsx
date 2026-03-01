"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ExternalLink, Store } from "lucide-react";
import { BillingProvider } from "@/contexts/billing-context";

function StoreAdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">لوحة التحكم</span>
            </Link>
            
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00853f] flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">متجري</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              عرض المتجر
            </Link>
            
            <UserButton 
              afterSignOutUrl="/dashboard"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}
            />
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6 pb-24 md:pb-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 md:hidden z-40">
        <div className="flex items-center justify-around h-16">
          <Link 
            href={`/store/${slug}/products`}
            className="flex flex-col items-center gap-1 text-zinc-500"
          >
            <Store className="w-5 h-5" />
            <span className="text-xs">المنتجات</span>
          </Link>
          <Link 
            href={`/store/${slug}/orders`}
            className="flex flex-col items-center gap-1 text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">الطلبات</span>
          </Link>
          <Link 
            href={`/store/${slug}/settings`}
            className="flex flex-col items-center gap-1 text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">الإعدادات</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function StoreAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <BillingProvider storeSlug={slug}>
      <StoreAdminContent>{children}</StoreAdminContent>
    </BillingProvider>
  );
}

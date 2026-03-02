"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 bg-white dark:bg-[#0a0a0a] border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between h-16 px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#171717] dark:bg-[#fafafa] flex items-center justify-center">
              <span className="text-white dark:text-[#171717] font-medium text-base">م</span>
            </div>
            <span className="text-base font-normal text-[#171717] dark:text-[#fafafa]">مارلون</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </div>
      </header>
      
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}

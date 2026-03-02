import Link from "next/link";
import { SignInButton, SignedOut } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <header className="flex items-center justify-between px-8 py-6">
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
        >
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
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  تسجيل الدخول عبر جوجل
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <div className="mt-12">
            <Link
              href="/dashboard"
              className="group flex items-center justify-center gap-4 w-full max-w-xs h-20 border border-dashed border-[#e5e5e5] dark:border-[#404040] hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-300 cursor-pointer mx-auto"
            >
              <div className="w-10 h-10 bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5 h-5 text-[#171717] dark:text-[#fafafa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="text-start">
                <p className="font-medium text-[#171717] dark:text-[#fafafa]">متجر جديد</p>
                <p className="text-sm text-[#737373]">أنشئ متجرك الآن</p>
              </div>
              <ArrowLeft className="absolute end-4 w-4 h-4 text-[#d4d4d4] group-hover:text-[#171717] group-hover:translate-x-1 transition-all duration-300" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-sm text-[#a3a3a3]">© 2026 Marlon. جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

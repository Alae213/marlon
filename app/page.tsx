import Link from "next/link";
import { SignInButton, SignedOut } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -start-1/2 w-[800px] h-[800px] rounded-full bg-[#00853f]/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -end-1/2 w-[600px] h-[600px] rounded-full bg-[#00853f]/3 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link 
          href="/" 
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00853f] flex items-center justify-center">
            <span className="text-white font-bold text-xl">م</span>
          </div>
          <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">مارلون</span>
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 leading-tight">
              أنشئ متجرك الإلكتروني
              <span className="block text-[#00853f]">في دقائق</span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              منصة تجارة إلكترونية للموزعين الجزائريين. أنشئ متجرك وابدأ البيع الآن بدون تكاليف شهرية
            </p>
          </div>

          <SignedOut>
            <div className="flex flex-col items-center gap-4">
              <SignInButton mode="modal">
                <button className="group relative flex items-center justify-center gap-3 w-full max-w-xs h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-900/10 dark:hover:shadow-white/10">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  تسجيل الدخول عبر جوجل
                </button>
              </SignInButton>

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                by continuing, you agree to our Terms of Service
              </p>
            </div>
          </SignedOut>

          <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">или создайте магазин</p>
            
            <Link
              href="/dashboard"
              className="group relative flex items-center justify-center gap-3 w-full max-w-xs h-20 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-[#00853f] hover:bg-[#00853f]/5 transition-all duration-300 cursor-pointer mx-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00853f]/10 flex items-center justify-center group-hover:bg-[#00853f] group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-[#00853f] group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="text-start">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">متجر جديد</p>
                <p className="text-sm text-zinc-500">أنشئ متجرك الآن</p>
              </div>
              <ArrowLeft className="absolute end-4 w-5 h-5 text-zinc-300 group-hover:text-[#00853f] group-hover:translate-x-1 transition-all duration-300" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center">
        <p className="text-sm text-zinc-400">© 2026 Marlon. جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

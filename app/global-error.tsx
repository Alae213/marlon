"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/core";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            حدث خطأ ما
          </h2>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            نعتذر، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
            <Link href="/">
              <Button>
                <Home className="w-4 h-4" />
                الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/core";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-bold text-zinc-400 dark:text-zinc-600">404</span>
        </div>
        
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          الصفحة غير موجودة
        </h2>
        
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="w-4 h-4" />
              الصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

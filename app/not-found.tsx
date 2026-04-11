import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/primitives/core/buttons/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[--system-100] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-normal text-[--system-300]">404</span>
        </div>
        
        <h2 className="text-xl font-normal text-[--system-700] mb-2">
          Page Not Found
        </h2>
        
        <p className="text-[--system-400] mb-6">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Home, Truck, Package, Megaphone } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/primitives/animate-ui/components/animate/tooltip";

interface BottomNavigationProps {
  storeSlug: string;
  currentPage: "orders" | "products" | "marketing";
}

export function BottomNavigation({ storeSlug, currentPage }: BottomNavigationProps) {
  const router = useRouter();

  const navItems = [
    {
      id: "marketing",
      label: "Marketing", 
      icon: Megaphone,
      href: `/marketing/${storeSlug}`,
      isActive: currentPage === "marketing",
    },
    {
      id: "products", 
      label: "Editor",
      icon: Package,
      href: `/editor/${storeSlug}`,
      isActive: currentPage === "products",
    },
    {
      id: "orders",
      label: "Orders",
      icon: Truck,
      href: `/orders/${storeSlug}`,
      isActive: currentPage === "orders",
    },
    
    
  ];

  return (
    <TooltipProvider>
      
      <div 
      className="fixed flex flex-row items-center backdrop-blur-[4px] overflow-hidden justify-center bottom-4 left-1/2 bg-[var(--system-600)] -translate-x-1/2  rounded-[999px] p-[5px] z-40 w-fit"
      style={{
        boxShadow: 'var(--bottom-nav-shadow)',
      }}>
        
        {/* Back to Home */}
        <Tooltip side="top">
          <TooltipTrigger asChild>
            <Link
              href="/"
              className="flex  flex-row items-center gap-2 px-[14px] py-[10px] rounded-[999px] transition-colors text-[var(--system-300)] dark:text-[var(--system-400)] hover:bg-white/10"
            >
              <Home className="w-5 h-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            Home
          </TooltipContent>
        </Tooltip>

        <div className="h-[22px] w-[1px] mx-2 "
            style={{
            background: "rgba(255, 255, 255, 0.13)",
            boxShadow: "1px 0px 0 0 rgba(0, 0, 0, 0.30)",
        }}/>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isExternal = item.id === "marketing";
          
          return (
            <Tooltip key={item.id} side="top">
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`flex flex-row items-center gap-2 px-[14px] py-[8px] rounded-[999px] transition-colors ${
                    item.isActive
                      ? "text-[var(--system-100)] bg-white/15 dark:text-[var(--system-50)]"
                      : "text-[var(--system-300)] dark:text-[var(--system-400)] hover:bg-white/10 "
                  }`}
                  style={{ 
                    fontWeight: '500',
                    ...(item.isActive && { boxShadow: "0px -1px 0 0px rgba(255, 255, 255, 0.5)" })
                  }}
                  
                >
                  <Icon className="w-5 h-5" />
                  {item.isActive && <span className="Body-base">{item.label}</span>}
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        
      </div>
      
     
    </TooltipProvider>
  );
}

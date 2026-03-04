"use client";

import { Truck, Package, Megaphone } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface BottomNavigationProps {
  storeSlug: string;
  currentPage: "orders" | "products" | "marketing";
}

export function BottomNavigation({ storeSlug, currentPage }: BottomNavigationProps) {
  const router = useRouter();

  const navItems = [
    {
      id: "orders",
      label: "الطلبات",
      icon: Truck,
      href: `/orders/${storeSlug}`,
      isActive: currentPage === "orders",
    },
    {
      id: "products", 
      label: "المنتجات",
      icon: Package,
      href: `/editor/${storeSlug}`,
      isActive: currentPage === "products",
    },
    {
      id: "marketing",
      label: "التسويق", 
      icon: Megaphone,
      href: `/marketing/${storeSlug}`,
      isActive: currentPage === "marketing",
    },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation - 200px centered */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-full px-6 py-2 flex justify-around items-center z-40 shadow-lg w-[300px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isExternal = item.id === "marketing";
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                item.isActive
                  ? "text-[#171717] dark:text-[#fafafa]"
                  : "text-[#a3a3a3] dark:text-[#525252] hover:text-[#171717] dark:hover:text-[#fafafa]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Add padding bottom to avoid content being hidden behind fixed nav */}
      <div className="h-20"></div>
    </>
  );
}

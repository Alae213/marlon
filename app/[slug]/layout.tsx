"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingCart, Store, Menu, X } from "lucide-react";
import { useState } from "react";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { CartSidebar } from "@/components/cart-sidebar";

function Navbar({ onCartClick }: { onCartClick: () => void }) {
  const params = useParams();
  const slug = params?.slug as string;
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href={`/${slug}`}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-[#00853f] flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">متجري</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href={`/${slug}`}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              الرئيسية
            </Link>
            <Link 
              href={`/${slug}`}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              المنتجات
            </Link>
            <Link 
              href={`/${slug}`}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              تواصل معنا
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onCartClick}
              className="relative p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 bg-[#00853f] text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-600 dark:text-zinc-400"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-200 dark:border-zinc-800">
            <nav className="flex flex-col gap-4">
              <Link 
                href={`/${slug}`}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                الرئيسية
              </Link>
              <Link 
                href={`/${slug}`}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                المنتجات
              </Link>
              <Link 
                href={`/${slug}`}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                تواصل معنا
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function StorefrontContent({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar onCartClick={() => setCartOpen(true)} />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-zinc-500">
          <p>جميع الحقوق محفوظة © 2024</p>
        </div>
      </footer>
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StorefrontContent>{children}</StorefrontContent>
    </CartProvider>
  );
}

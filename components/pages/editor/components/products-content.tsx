"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Settings, Eye, Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Root as ScrollAreaRoot,
  Viewport as ScrollAreaViewport,
  Scrollbar as ScrollAreaScrollbar,
  Thumb as ScrollAreaThumb,
} from "@radix-ui/react-scroll-area";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/contexts/toast-context";

import { AddProductTile } from "./add-product-tile";
import { ProductCard } from "./product-card";
import { NavbarEditor } from "./navbar-editor";
import { HeroEditor } from "./hero-editor";
import { SettingsDialog } from "./settings-dialog";
import { EditorProductDetailModal } from "./editor-product-detail-modal";
import { BottomNavigation } from "@/components/primitives/core";

function isValidConvexId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && /^[a-zA-Z0-9]+$/.test(id);
}

function toProductId(id: string, context: string): Id<"products"> {
  if (!isValidConvexId(id)) {
    throw new Error(`Invalid ID provided for ${context}`);
  }
  return id as unknown as Id<"products">;
}

interface ProductsContentProps {
  storeId: Id<"stores">;
  storeSlug: string;
  initialSettingsTab?: string;
}

export function ProductsContent({ storeId, storeSlug, initialSettingsTab }: ProductsContentProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => Boolean(initialSettingsTab));
  const [copied, setCopied] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const products = useQuery(api.products.getAllProducts, { storeId });
  const store = useQuery(api.stores.getStore, { storeId });
  const navbarContent = useQuery(api.siteContent.getSiteContentResolved, {
    storeId,
    section: "navbar",
  });
  const heroContent = useQuery(api.siteContent.getSiteContentResolved, {
    storeId,
    section: "hero",
  });

  const createQuickProduct = useMutation(api.products.createQuickProduct);
  const archiveProduct = useMutation(api.products.archiveProduct);
  const unarchiveProduct = useMutation(api.products.unarchiveProduct);
  const deleteHiddenProduct = useMutation(api.products.deleteHiddenProduct);
  const workspaceProducts = useMemo(() => products ?? [], [products]);
  const selectedProduct = useMemo(
    () => workspaceProducts.find((product) => product._id === selectedProductId) ?? null,
    [selectedProductId, workspaceProducts],
  );

  useEffect(() => {
    if (!highlightedProductId) {
      return;
    }

    const card = document.querySelector<HTMLElement>(
      `[data-product-card-id="${highlightedProductId}"]`,
    );

    if (!card) {
      return;
    }

    window.requestAnimationFrame(() => {
      card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });

    const timeout = window.setTimeout(() => {
      setHighlightedProductId(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [highlightedProductId, workspaceProducts]);

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/${storeSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [storeSlug]);

  const handleQuickCreate = useCallback(async () => {
    try {
      const productId = await createQuickProduct({ storeId });
      setHighlightedProductId(productId);
    } catch (error) {
      console.error("Failed to create hidden product:", error);
      showToast("Failed to create hidden product", "error");
    }
  }, [createQuickProduct, showToast, storeId]);

  const handleToggleArchive = useCallback(
    async (productId: string, currentStatus?: boolean) => {
      try {
        const validId = toProductId(productId, "toggle product visibility");
        if (currentStatus) {
          await unarchiveProduct({ productId: validId });
        } else {
          await archiveProduct({ productId: validId });
        }
      } catch (error) {
        console.error("Failed to toggle product visibility:", error);
        showToast("Failed to update product visibility", "error");
      }
    },
    [archiveProduct, showToast, unarchiveProduct],
  );

  const handleDeleteHiddenProduct = useCallback(
    async (productId: string) => {
      try {
        const validId = toProductId(productId, "delete product");
        await deleteHiddenProduct({ productId: validId });
        if (selectedProductId === productId) {
          setSelectedProductId(null);
        }
        setDeletingProductId(null);
        showToast("Product deleted", "success");
      } catch (error) {
        console.error("Failed to delete product:", error);
        showToast("Failed to delete product", "error");
      }
    },
    [deleteHiddenProduct, selectedProductId, showToast],
  );

  return (
    <div className="h-screen w-full">
      <div className="flex h-full flex-col items-center justify-center bg-[var(--system-200)]">
        <div className="flex w-full items-center justify-between px-[12px] pt-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image src="/Logo-text.svg" alt="Marlon Logo" width={118} height={36} className="h-[10px] w-auto" />
            </Link>
          </div>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
        </div>

        <div className="flex-1" />
        <div
          style={{
            background: "linear-gradient(0deg, #434545 100%, #212525 0%)",
            boxShadow: "var(--shadow-xl-shadow)",
          }}
          className="mx-auto flex h-[100vh] w-full max-w-7xl flex-col gap-[8px] overflow-hidden rounded-t-[20px] px-[12px] pb-[0px] pt-[8px]"
        >
          <div className="flex h-[24px] items-center justify-between px-[8px]">
            <div className="flex w-[150px] items-center gap-2">
              <button
                onClick={() => router.push("/")}
                className="flex cursor-pointer items-center justify-center"
              >
                <Image src="/windw.svg" alt="marlon" width={24} height={24} className="w-8" />
              </button>
            </div>

            <div className="flex h-[26px] flex-1 justify-center">
              <div
                style={{ boxShadow: "var(--shadow-inside-shadow)" }}
                className="flex h-full w-[300px] flex-row items-center justify-between gap-2 rounded-[8px] bg-black/40 p-[3px] py-1 pl-[6px]"
              >
                <div className="flex w-[50px] items-center gap-2">
                  <Image src="/favicon.svg" alt="Marlon" width={27} height={27} className="h-4 w-4" />
                </div>
                <div className="group relative cursor-pointer">
                  <p className="text-micro-label text-[var(--system-300)]">
                    {store?.name ?? storeSlug}
                    <span className="text-micro-label pointer-events-none absolute left-[-42px] top-[42px] z-50 mt-1 w-max rounded bg-[var(--system-100)] px-2 py-1 text-[var(--system-400)] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      marlon.app/{storeSlug}
                    </span>
                  </p>
                </div>
                <div className="flex w-[50px] justify-end">
                  <button
                    onClick={handleCopy}
                    aria-label="Copy store URL"
                    className="flex h-4 w-4 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:bg-white/10"
                  >
                    <AnimatePresence mode="wait">
                      {!copied ? (
                        <motion.div
                          key="copy"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Copy className="h-3 w-3 text-[var(--system-300)]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="check"
                          initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: "blur(0px)",
                            transition: { duration: 0.1, type: "spring", stiffness: 500, damping: 25 },
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            filter: "blur(4px)",
                            transition: { duration: 0.1 },
                          }}
                        >
                          <Check className="h-3 w-3 stroke-[3px] text-[--color-success]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex w-[150px] justify-end gap-1">
              <button
                onClick={(event) => {
                  event.preventDefault();
                  window.open(`/${storeSlug}`, "_blank");
                }}
                className="text-micro-label flex h-6 w-fit cursor-pointer flex-row items-center justify-center gap-[8px] rounded-[10px] bg-white/5 px-[8px] text-white transition-all hover:bg-white/10 focus:outline-none"
              >
                <Eye className="h-3 w-3 stroke-[2px]" />
                Preview
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
                className="text-micro-label flex h-6 w-fit cursor-pointer flex-row items-center justify-center gap-[8px] rounded-[10px] bg-white/5 px-[8px] text-white transition-all hover:bg-white/10 focus:outline-none"
              >
                <Settings className="h-3.5 w-3.5 stroke-[2px]" />
              </button>
            </div>
          </div>

          <ScrollAreaRoot className="min-h-0 w-full flex-1 overflow-hidden rounded-t-[12px]">
            <ScrollAreaViewport className="h-full overflow-y-auto rounded-t-[12px] bg-[var(--system-100)]">
              <NavbarEditor storeId={storeId} navbarContent={navbarContent} />
              <HeroEditor storeId={storeId} heroContent={heroContent} />

              <div className="px-16 py-[4.5rem]">
                <h2 className="text-title px-4 mb-6 font-semibold text-[var(--system-700)]">
                  Our Products
                </h2>
                {workspaceProducts.length === 0 ? (
                  <div className="grid grid-cols-2 gap-4 px-16 py-[4.5rem] pb-32 md:grid-cols-3 lg:grid-cols-4">
                    <AddProductTile onClick={handleQuickCreate} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4  pb-32 md:grid-cols-3 lg:grid-cols-4">
                    {workspaceProducts.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        isHighlighted={highlightedProductId === product._id}
                        onOpen={(nextProduct) => setSelectedProductId(nextProduct._id)}
                        onToggleArchive={handleToggleArchive}
                        deletingProductId={deletingProductId}
                        onRequestDelete={setDeletingProductId}
                        onCancelDelete={() => setDeletingProductId(null)}
                        onConfirmDelete={handleDeleteHiddenProduct}
                      />
                    ))}

                    <AddProductTile onClick={handleQuickCreate} />
                  </div>
                )}
              </div>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar
              orientation="vertical"
              className="flex w-2 touch-none select-none p-[1px] transition-colors"
            >
              <ScrollAreaThumb className="relative flex-1 rounded-full bg-[var(--system-300)]/0" />
            </ScrollAreaScrollbar>
          </ScrollAreaRoot>

          <BottomNavigation storeSlug={storeSlug} currentPage="products" />
        </div>
        <div className="flex-1" />
      </div>

      <EditorProductDetailModal
        open={selectedProduct !== null}
        product={selectedProduct}
        storeSlug={storeSlug}
        onClose={() => setSelectedProductId(null)}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        initialTab={initialSettingsTab ?? "delivery"}
      />
    </div>
  );
}

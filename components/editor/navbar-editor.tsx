"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Palette,
  Upload,
  Trash2,
  Crop,
  X,
  Menu,
} from "lucide-react";
import { CartIcon } from "@/components/core/cart-icon";
import { ImageCropper } from "@/components/image-cropper";
import { useImageUpload } from "./hooks/use-image-upload";
import type { NavbarContent, NavbarLink } from "./types";

interface NavbarEditorProps {
  storeId: Id<"stores">;
  navbarContent: { content: unknown } | null | undefined;
}

export function NavbarEditor({ storeId, navbarContent }: NavbarEditorProps) {
  // ── UI State ──────────────────────────────────────────────────
  const [isHovered, setIsHovered] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoToolbarOpen, setLogoToolbarOpen] = useState(false);

  // Inline text editing state - store linkId with text to avoid stale closures
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingLinkIdForSave, setEditingLinkIdForSave] = useState<string | null>(null);

  // Mobile state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Mutations ─────────────────────────────────────────────────
  const setNavbarStyles = useMutation(api.siteContent.setNavbarStyles);
  const updateNavbarLink = useMutation(api.siteContent.updateNavbarLink);
  const setLogoAndSyncFooter = useMutation(api.siteContent.setLogoAndSyncFooter);
  const deleteNavbarLogo = useMutation(api.siteContent.deleteNavbarLogo);
  const { uploadToStorage } = useImageUpload();

  // ── Derived Data ─────────────────────────────────────────────
  const currentNavbar = (navbarContent?.content ?? undefined) as NavbarContent | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText = currentNavbar?.textColor ?? "dark";
  const navbarLogoUrl = currentNavbar?.logoUrl;
  // Ensure each link has a unique ID - fall back to index if id is missing/duplicate
  const getLinkKey = (link: NavbarLink, index: number) => {
    return link?.id ?? `link-${index}`;
  };
  const links: NavbarLink[] = (currentNavbar?.links ?? [
    { id: "link-shop", text: "Shop", url: "#products", isDefault: true, enabled: true },
    { id: "link-faq", text: "FAQ", url: "/", isDefault: true, enabled: true },
    { id: "link-help", text: "Help", url: "/", isDefault: true, enabled: true },
  ]).map((link, index) => ({ ...link, id: getLinkKey(link, index) }));

  // ── Background Classes ────────────────────────────────────────
  const getBackgroundClass = () => {
    switch (navbarBg) {
      case "dark":
        return "bg-[#0a0a0a]";
      case "glass":
        return "bg-transparent";
      default:
        return "bg-white";
    }
  };

  const getGlassEffect = () => {
    if (navbarBg !== "glass") return {};
    return {
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
    };
  };

  const getTextClass = () => {
    return navbarText === "light" ? "text-white" : "text-[#171717]";
  };

  // ── Style Handlers ────────────────────────────────────────────
  const handleSetBackground = useCallback(
    async (background: "light" | "dark" | "glass") => {
      try {
        await setNavbarStyles({ storeId, background });
      } catch (error) {
        console.error("Failed to update navbar style:", error);
      }
    },
    [setNavbarStyles, storeId]
  );

  const handleSetTextColor = useCallback(
    async (textColor: "dark" | "light") => {
      try {
        await setNavbarStyles({ storeId, textColor });
      } catch (error) {
        console.error("Failed to update text color:", error);
      }
    },
    [setNavbarStyles, storeId]
  );

  // ── Logo Handlers ─────────────────────────────────────────────
  const handleSelectLogoFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogoCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleApplyLogoCrop = useCallback(
    async (croppedDataUrl: string) => {
      setIsUploadingLogo(true);
      try {
        const storageId = await uploadToStorage(croppedDataUrl);
        await setLogoAndSyncFooter({ storeId, logoStorageId: storageId });
        setLogoCropSrc(null);
      } catch (error) {
        console.error("Failed to upload logo:", error);
      }
      setIsUploadingLogo(false);
    },
    [uploadToStorage, setLogoAndSyncFooter, storeId]
  );

  const handleDeleteLogo = useCallback(async () => {
    try {
      await deleteNavbarLogo({ storeId });
      setLogoToolbarOpen(false);
    } catch (error) {
      console.error("Failed to delete logo:", error);
    }
  }, [deleteNavbarLogo, storeId]);

  // ── Inline Text Editing ───────────────────────────────────────
  const handleStartEditing = useCallback((link: NavbarLink) => {
    setEditingLinkId(link.id);
    setEditingLinkIdForSave(link.id);
    setEditingText(link.text);
  }, []);

  const handleSaveText = useCallback(async () => {
    const linkId = editingLinkIdForSave;
    const trimmed = editingText.trim();
    if (!linkId || !trimmed) {
      setEditingLinkId(null);
      setEditingLinkIdForSave(null);
      return;
    }
    try {
      await updateNavbarLink({ storeId, linkId, text: trimmed });
    } catch (error) {
      console.error("Failed to update link text:", error);
    }
    setEditingLinkId(null);
    setEditingLinkIdForSave(null);
  }, [editingLinkIdForSave, editingText, updateNavbarLink, storeId]);

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveText();
      }
      if (e.key === "Escape") {
        setEditingLinkId(null);
        setEditingLinkIdForSave(null);
      }
    },
    [handleSaveText]
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setLogoToolbarOpen(false);
        }}
      >
        {/* Navbar */}
        <div className={`overflow-hidden ${getBackgroundClass()}`} style={getGlassEffect()}>
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo Section */}
            <div className="flex items-center gap-3 min-w-0 relative">
              <div
                className="relative"
                onMouseEnter={() => setLogoToolbarOpen(true)}
                onMouseLeave={() => setLogoToolbarOpen(false)}
              >
                <button
                  onClick={() => document.getElementById("navbar-logo-upload")?.click()}
                  className="cursor-pointer"
                >
                  <div className="w-10 h-10 bg-[#f5f5f5] dark:bg-[#171717] overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                    {navbarLogoUrl ? (
                      <Image src={navbarLogoUrl} alt="logo" fill className="object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-[#a3a3a3]" />
                    )}
                  </div>
                </button>

                {/* Logo Toolbar */}
                <AnimatePresence>
                  {logoToolbarOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full mt-2 left-0 flex items-center gap-1 bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-lg shadow-lg p-1 z-50"
                    >
                      <button
                        onClick={() => document.getElementById("navbar-logo-upload")?.click()}
                        className="p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded flex items-center gap-1 text-xs text-[#525252] dark:text-[#d4d4d4]"
                        title="Change"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const fileInput = document.getElementById("navbar-logo-upload") as HTMLInputElement | null;
                          if (fileInput?.files?.[0]) {
                            const reader = new FileReader();
                            reader.onload = () => setLogoCropSrc(reader.result as string);
                            reader.readAsDataURL(fileInput.files[0]);
                          }
                        }}
                        className="p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded flex items-center gap-1 text-xs text-[#525252] dark:text-[#d4d4d4]"
                        title="Crop"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleDeleteLogo}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-1 text-xs text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  id="navbar-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleSelectLogoFile}
                  className="hidden"
                />
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className={`w-5 h-5 ${getTextClass()}`} />
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => (
                <div key={link.id} className="relative group">
                  {editingLinkId === link.id ? (
                    <input
                      key={`input-${link.id}`}
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={handleSaveText}
                      onKeyDown={handleTextKeyDown}
                      autoFocus
                      className={`px-3 py-2 text-sm bg-transparent border-b-2 border-[#171717] dark:border-[#fafafa] outline-none ${getTextClass()} w-24`}
                    />
                  ) : (
                    <button
                      key={`btn-${link.id}`}
                      onClick={() => handleStartEditing(link)}
                      className={`px-3 py-2 text-sm ${getTextClass()} hover:opacity-70 transition-opacity cursor-text`}
                    >
                      {link.text}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Cart Icon */}
            <div className="flex items-center gap-2">
              <button
                className={`w-9 h-9 flex items-center justify-center border border-[#e5e5e5] dark:border-[#262626] ${getTextClass()}`}
                aria-label="Cart"
              >
                <CartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Style Toolbar - Bottom Center */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border border-[#e5e5e5] dark:border-[#262626] px-3 py-2 rounded-full shadow-lg z-40"
              >
                {/* Background Mode Toggle */}
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4 text-[#737373]" />
                  <button
                    onClick={() => handleSetBackground("light")}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      navbarBg === "light"
                        ? "border-[#171717] bg-[#171717] text-white"
                        : "border-[#e5e5e5] text-[#525252] hover:border-[#171717]"
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleSetBackground("dark")}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      navbarBg === "dark"
                        ? "border-[#fafafa] bg-[#fafafa] text-[#171717]"
                        : "border-[#e5e5e5] text-[#525252] hover:border-[#fafafa]"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => handleSetBackground("glass")}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      navbarBg === "glass"
                        ? "border-[#171717] bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "border-[#e5e5e5] text-[#525252] hover:border-[#171717]"
                    }`}
                  >
                    Glass
                  </button>
                </div>

                {/* Text Color Toggle (Glass mode only) */}
                {navbarBg === "glass" && (
                  <>
                    <div className="w-px h-6 bg-[#e5e5e5] dark:bg-[#262626]" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSetTextColor("dark")}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          navbarText === "dark"
                            ? "border-[#171717] bg-[#171717] text-white"
                            : "border-[#e5e5e5] text-[#525252] hover:border-[#171717]"
                        }`}
                      >
                        Dark text
                      </button>
                      <button
                        onClick={() => handleSetTextColor("light")}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          navbarText === "light"
                            ? "border-[#fafafa] bg-[#fafafa] text-[#171717]"
                            : "border-[#e5e5e5] text-[#525252] hover:border-[#fafafa]"
                        }`}
                      >
                        Light text
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-[#0a0a0a] shadow-xl z-50 lg:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                <h2 className="text-lg font-medium text-[#171717] dark:text-[#fafafa]">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="p-3 rounded-lg bg-[#f5f5f5] dark:bg-[#171717]"
                  >
                    {editingLinkId === link.id ? (
                      <input
                        key={`input-${link.id}`}
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleSaveText}
                        onKeyDown={handleTextKeyDown}
                        autoFocus
                        className="w-full bg-transparent border-b-2 border-[#171717] dark:border-[#fafafa] outline-none text-[#171717] dark:text-[#fafafa]"
                      />
                    ) : (
                      <button
                        key={`btn-${link.id}`}
                        onClick={() => handleStartEditing(link)}
                        className="text-[#171717] dark:text-[#fafafa] w-full text-left cursor-text"
                      >
                        {link.text}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      {logoCropSrc && (
        <ImageCropper
          imageSrc={logoCropSrc}
          aspectRatio={1}
          onCancel={() => setLogoCropSrc(null)}
          onCropComplete={handleApplyLogoCrop}
        />
      )}
    </>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
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
  GripVertical,
  Plus,
  X,
  Menu,
  ChevronUp,
  ChevronDown,
  Link2,
  Edit3,
} from "lucide-react";
import { CartIcon } from "@/components/core/cart-icon";
import { Button } from "@/components/core/button";
import { ImageCropper } from "@/components/image-cropper";
import { useImageUpload } from "./hooks/use-image-upload";
import { generateId } from "./utils";
import type { NavbarContent, NavbarLink } from "./types";

interface NavbarEditorProps {
  storeId: Id<"stores">;
  navbarContent: { content: unknown } | null | undefined;
}

// Preset link options
const LINK_PRESETS = [
  { id: "preset-home", text: "الرئيسية", url: "/" },
  { id: "preset-products", text: "المنتجات", url: "#products" },
  { id: "preset-about", text: "من نحن", url: "/about" },
  { id: "preset-contact", text: "تواصل معنا", url: "/contact" },
  { id: "preset-privacy", text: "سياسة الخصوصية", url: "/privacy" },
];

export function NavbarEditor({ storeId, navbarContent }: NavbarEditorProps) {
  // ── UI State ──────────────────────────────────────────────────
  const [isHovered, setIsHovered] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoToolbarOpen, setLogoToolbarOpen] = useState(false);
  const [styleToolbarOpen, setStyleToolbarOpen] = useState(false);
  
  // Link editing state
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<NavbarLink | null>(null);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  
  // Mobile state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileReorderMode, setMobileReorderMode] = useState(false);
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);
  
  // Refs for drag
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ── Mutations ─────────────────────────────────────────────────
  const setNavbarStyles = useMutation(api.siteContent.setNavbarStyles);
  const setNavbarLinks = useMutation(api.siteContent.setNavbarLinks);
  const addNavbarLink = useMutation(api.siteContent.addNavbarLink);
  const removeNavbarLink = useMutation(api.siteContent.removeNavbarLink);
  const updateNavbarLink = useMutation(api.siteContent.updateNavbarLink);
  const setLogoAndSyncFooter = useMutation(api.siteContent.setLogoAndSyncFooter);
  const deleteNavbarLogo = useMutation(api.siteContent.deleteNavbarLogo);
  const { uploadToStorage } = useImageUpload();

  // ── Derived Data ─────────────────────────────────────────────
  const currentNavbar = (navbarContent?.content ?? undefined) as NavbarContent | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText = currentNavbar?.textColor ?? "dark";
  const navbarLogoUrl = currentNavbar?.logoUrl;
  const links: NavbarLink[] = currentNavbar?.links ?? [
    { id: "link-shop", text: "Shop", url: "#products", isDefault: true, enabled: true },
    { id: "link-faq", text: "FAQ", url: "/", isDefault: true, enabled: true },
    { id: "link-help", text: "Help", url: "/", isDefault: true, enabled: true },
  ];

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

  // ── Link Handlers ─────────────────────────────────────────────
  const handleOpenLinkForm = useCallback((link?: NavbarLink) => {
    if (link) {
      setEditingLink(link);
      setLinkText(link.text);
      setLinkUrl(link.url);
    } else {
      setEditingLink(null);
      setLinkText("");
      setLinkUrl("");
    }
    setLinkFormOpen(true);
  }, []);

  const handleSaveLink = useCallback(async () => {
    if (!linkText.trim() || !linkUrl.trim()) return;

    try {
      if (editingLink) {
        // Update existing link
        await updateNavbarLink({
          storeId,
          linkId: editingLink.id,
          text: linkText.trim(),
          url: linkUrl.trim(),
        });
      } else {
        // Add new link
        await addNavbarLink({
          storeId,
          link: {
            id: generateId(),
            text: linkText.trim(),
            url: linkUrl.trim(),
            isDefault: false,
            enabled: true,
          },
        });
      }
      setLinkFormOpen(false);
      setEditingLink(null);
      setLinkText("");
      setLinkUrl("");
    } catch (error) {
      console.error("Failed to save link:", error);
    }
  }, [editingLink, linkText, linkUrl, updateNavbarLink, addNavbarLink, storeId]);

  const handleDeleteLink = useCallback(async (linkId: string) => {
    try {
      await removeNavbarLink({ storeId, linkId });
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
  }, [removeNavbarLink, storeId]);

  // ── Drag & Drop Handlers ─────────────────────────────────────
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
    setDraggedLinkId(links[index].id);
  }, [links]);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleDragEnd = useCallback(async () => {
    if (dragItem.current === null || dragOverItem.current === null) {
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggedLinkId(null);
      return;
    }

    const newLinks = [...links];
    const draggedItem = newLinks[dragItem.current];
    newLinks.splice(dragItem.current, 1);
    newLinks.splice(dragOverItem.current, 0, draggedItem);

    try {
      await setNavbarLinks({ storeId, links: newLinks });
    } catch (error) {
      console.error("Failed to reorder links:", error);
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedLinkId(null);
  }, [links, setNavbarLinks, storeId]);

  // ── Mobile Reorder ────────────────────────────────────────────
  const handleMoveLink = useCallback(async (index: number, direction: "up" | "down") => {
    const newLinks = [...links];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;
    
    [newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]];
    
    try {
      await setNavbarLinks({ storeId, links: newLinks });
    } catch (error) {
      console.error("Failed to reorder links:", error);
    }
  }, [links, setNavbarLinks, storeId]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setLogoToolbarOpen(false);
          setStyleToolbarOpen(false);
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
                        title="تغيير"
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
                        title="قص"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLogo}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-1 text-xs text-red-500"
                        title="حذف"
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
              {links.map((link, index) => (
                <div
                  key={link.id}
                  className="relative group"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <a
                    href={link.url}
                    className={`flex items-center gap-1 px-3 py-2 text-sm ${getTextClass()} hover:opacity-70 transition-opacity`}
                  >
                    <GripVertical className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 cursor-grab" />
                    {link.text}
                  </a>
                  
                  {/* Edit/Delete for custom links on hover */}
                  {!link.isDefault && (
                    <div className="absolute top-full mt-1 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded shadow-lg p-1 z-50">
                      <button
                        onClick={() => handleOpenLinkForm(link)}
                        className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#525252]" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Link Button */}
              <button
                onClick={() => handleOpenLinkForm()}
                className={`flex items-center gap-1 px-3 py-2 text-sm ${getTextClass()} hover:opacity-70 transition-opacity`}
              >
                <Plus className="w-4 h-4" />
                إضافة رابط
              </button>
            </div>

            {/* Cart Icon */}
            <div className="flex items-center gap-2">
              <button
                className={`w-9 h-9 flex items-center justify-center border border-[#e5e5e5] dark:border-[#262626] ${getTextClass()}`}
                aria-label="السلة"
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
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border border-[#e5e5e5] dark:border-[#262626] px-3 py-2 rounded-full shadow-lg z-40"
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
                        نص داكن
                      </button>
                      <button
                        onClick={() => handleSetTextColor("light")}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${
                          navbarText === "light"
                            ? "border-[#fafafa] bg-[#fafafa] text-[#171717]"
                            : "border-[#e5e5e5] text-[#525252] hover:border-[#fafafa]"
                        }`}
                      >
                        نص فاتح
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
                <h2 className="text-lg font-medium text-[#171717] dark:text-[#fafafa]">القائمة</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {links.map((link, index) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-3 rounded-lg bg-[#f5f5f5] dark:bg-[#171717] ${
                      draggedLinkId === link.id ? "opacity-50" : ""
                    }`}
                  >
                    <a
                      href={link.url}
                      className="text-[#171717] dark:text-[#fafafa] flex-1"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.text}
                    </a>
                    
                    {mobileReorderMode && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveLink(index, "up")}
                          disabled={index === 0}
                          className="p-1 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveLink(index, "down")}
                          disabled={index === links.length - 1}
                          className="p-1 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Link Button */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenLinkForm();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-[#d4d4d4] dark:border-[#404040] text-[#525252] dark:text-[#d4d4d4] hover:border-[#171717] dark:hover:border-[#fafafa]"
                >
                  <Plus className="w-4 h-4" />
                  إضافة رابط
                </button>

                {/* Reorder Toggle */}
                <button
                  onClick={() => setMobileReorderMode(!mobileReorderMode)}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border ${
                    mobileReorderMode
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#d4d4d4]"
                  }`}
                >
                  <GripVertical className="w-4 h-4" />
                  {mobileReorderMode ? "تم" : "ترتيب الروابط"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Link Form Modal */}
      <AnimatePresence>
        {linkFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setLinkFormOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#171717] dark:text-[#fafafa]">
                  {editingLink ? "تعديل الرابط" : "إضافة رابط"}
                </h3>
                <button
                  onClick={() => setLinkFormOpen(false)}
                  className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Link Text */}
                <div>
                  <label className="block text-sm text-[#525252] dark:text-[#d4d4d4] mb-1">
                    نص الرابط
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="مثال: العروض"
                    className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa]"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm text-[#525252] dark:text-[#d4d4d4] mb-1">
                    <Link2 className="w-4 h-4 inline ml-1" />
                    الرابط
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/about أو https://..."
                    className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa]"
                  />
                  
                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {LINK_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setLinkText(preset.text);
                          setLinkUrl(preset.url);
                        }}
                        className="text-xs px-2 py-1 bg-[#f5f5f5] dark:bg-[#171717] rounded hover:bg-[#e5e5e5] dark:hover:bg-[#262626] text-[#525252] dark:text-[#d4d4d4]"
                      >
                        {preset.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setLinkFormOpen(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSaveLink}
                    disabled={!linkText.trim() || !linkUrl.trim()}
                    className="flex-1"
                  >
                    {editingLink ? "حفظ" : "إضافة"}
                  </Button>
                </div>
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

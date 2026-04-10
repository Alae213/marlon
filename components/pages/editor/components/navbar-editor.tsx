"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { CartIcon } from "@/components/primitives/core/media/cart-icon";
import { TooltipProvider } from "@/components/primitives/animate-ui/components/animate/tooltip";
import { useImageUpload } from "../hooks/use-image-upload";
import type { NavbarContent, NavbarLink } from "../types";
import { FloatingStyleToolbar } from "../navbar/floating-style-toolbar";
import { LogoButton } from "../navbar/logo-button";
import { LogoToolbar } from "../navbar/logo-toolbar";
import { NavLinks } from "../navbar/nav-links";
import { MobileMenuDrawer } from "../navbar/mobile-menu-drawer";

const ImageCropper = dynamic(() =>
  import("@/components/features/shared/image-cropper").then((mod) => mod.ImageCropper),
);

const DEFAULT_LINKS: NavbarLink[] = [
  { id: "link-shop", text: "Shop", url: "#products", isDefault: true, enabled: true },
  { id: "link-faq", text: "FAQ", url: "/", isDefault: true, enabled: true },
  { id: "link-help", text: "Help", url: "/", isDefault: true, enabled: true },
];

interface NavbarEditorProps {
  storeId: Id<"stores">;
  navbarContent: { content: unknown } | null | undefined;
}

export function NavbarEditor({ storeId, navbarContent }: NavbarEditorProps) {
  // ── UI State ──────────────────────────────────────────────────
  const [isHovered, setIsHovered] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [logoToolbarOpen, setLogoToolbarOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingLinkIdForSave, setEditingLinkIdForSave] = useState<string | null>(null);
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

  const links: NavbarLink[] = useMemo(() => {
    return (currentNavbar?.links ?? DEFAULT_LINKS).map((link: NavbarLink, index: number) => ({
      ...link,
      id: link?.id ?? `link-${index}`,
    }));
  }, [currentNavbar?.links]);

  const glassEffect = useMemo(() => {
    if (navbarBg !== "glass") return {};
    return {
      background: "rgba(255, 255, 255, 0.01)",
      backdropFilter: "blur(24px)",
    };
  }, [navbarBg]);

  const backgroundClass =
    navbarBg === "dark" ? "bg-slate-950"
    : navbarBg === "glass" ? "bg-transparent"
    : "bg-white";

  const textClass = navbarText === "light" ? "text-white" : "text-foreground";

  // ── Handlers ──────────────────────────────────────────────────
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

  const handleSelectLogoFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogoCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleApplyLogoCrop = useCallback(
    async (croppedDataUrl: string) => {
      try {
        const storageId = await uploadToStorage(croppedDataUrl);
        await setLogoAndSyncFooter({ storeId, logoStorageId: storageId });
        setLogoCropSrc(null);
      } catch (error) {
        console.error("Failed to upload logo:", error);
      }
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

  const handleCropFromInput = useCallback(() => {
    const fileInput = document.getElementById("navbar-logo-upload") as HTMLInputElement | null;
    if (fileInput?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setLogoCropSrc(reader.result as string);
      reader.readAsDataURL(fileInput.files[0]);
    }
  }, []);

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

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setLogoToolbarOpen(false);
  }, []);

  // ── Shared link editing props ─────────────────────────────────
  const linkEditingProps = {
    editingLinkId,
    editingText,
    onStartEditing: handleStartEditing,
    onTextChange: setEditingText,
    onSaveText: handleSaveText,
    onTextKeyDown: handleTextKeyDown,
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <TooltipProvider>
      {/* Outer wrapper: positioning context for the toolbar + hover detection */}
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Navbar */}
        <div className={`${backgroundClass}`} style={glassEffect}>
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 min-h-[56px]">
            {/* Logo Section + Mobile Button */}
            <div className="flex items-center min-w-0">
              {/* Logo Button + Logo Toolbar — hover container (also keeps toolbar outside glass navbar div) */}
              <div
                className="relative"
                onMouseEnter={() => setLogoToolbarOpen(true)}
                onMouseLeave={() => setLogoToolbarOpen(false)}
              >
                <LogoButton
                  logoUrl={navbarLogoUrl}
                  onClick={() => document.getElementById("navbar-logo-upload")?.click()}
                />
                <LogoToolbar
                  isOpen={logoToolbarOpen}
                  onUpload={() => { document.getElementById("navbar-logo-upload")?.click(); }}
                  onCrop={handleCropFromInput}
                  onDelete={handleDeleteLogo}
                />
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
                className="lg:hidden p-2 ml-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className={`w-5 h-5 ${textClass}`} />
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <NavLinks links={links} textClass={textClass} {...linkEditingProps} />

            {/* Cart Icon */}
            <button
              className={`w-9 h-9 flex items-center justify-center border border-border dark:border-slate-800 ${textClass}`}
              aria-label="Cart"
            >
              <CartIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Style Toolbar — sibling of navbar div, not inside it */}
        <FloatingStyleToolbar
          isHovered={isHovered}
          navbarBg={navbarBg}
          navbarText={navbarText}
          onSetBackground={handleSetBackground}
          onSetTextColor={handleSetTextColor}
        />
      </div>

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={mobileMenuOpen}
        links={links}
        {...linkEditingProps}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Image Cropper Modal */}
      {logoCropSrc && (
        <ImageCropper
          imageSrc={logoCropSrc}
          aspectRatio={1}
          onCancel={() => setLogoCropSrc(null)}
          onCropComplete={handleApplyLogoCrop}
        />
      )}
    </TooltipProvider>
  );
}

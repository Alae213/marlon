"use client";

import { useCallback, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { Package } from "lucide-react";
import { Card } from "@/components/core/card";
import type { FooterContent, NavbarContent, EditingField } from "./types";

const SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "whatsapp"] as const;

interface FooterEditorProps {
  storeId: Id<"stores">;
  footerContent: { content: unknown } | null | undefined;
  navbarContent: { content: unknown } | null | undefined;
  editingField: EditingField | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (field: "footerPhone" | "footerEmail" | "footerCopyright", value: string) => void;
  onSaveEdit: () => void;
}

export function FooterEditor({
  storeId,
  footerContent,
  navbarContent,
  editingField,
  editValue,
  onEditValueChange,
  onStartEditing,
  onSaveEdit,
}: FooterEditorProps) {
  const setFooterStyles = useMutation(api.siteContent.setFooterStyles);

  const currentFooter = (footerContent?.content ?? undefined) as FooterContent | undefined;
  const footerLogoUrl = (navbarContent?.content as NavbarContent | undefined)?.logoUrl;
  const contactPhone = currentFooter?.contactPhone ?? "";
  const contactEmail = currentFooter?.contactEmail ?? "";
  const copyright = currentFooter?.copyright ?? "جميع الحقوق محفوظة";
  const socialLinks = useMemo(() => currentFooter?.socialLinks ?? [], [currentFooter?.socialLinks]);

  const isEditingPhone = editingField?.field === "footerPhone";
  const isEditingEmail = editingField?.field === "footerEmail";
  const isEditingCopyright = editingField?.field === "footerCopyright";

  const handlePhoneBlur = useCallback(async () => {
    await setFooterStyles({ storeId, contactPhone: editValue });
    onSaveEdit();
  }, [editValue, setFooterStyles, storeId, onSaveEdit]);

  const handlePhoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        setFooterStyles({ storeId, contactPhone: editValue });
        onSaveEdit();
      } else if (e.key === "Escape") {
        onSaveEdit();
      }
    },
    [editValue, setFooterStyles, storeId, onSaveEdit]
  );

  const handleEmailBlur = useCallback(async () => {
    await setFooterStyles({ storeId, contactEmail: editValue });
    onSaveEdit();
  }, [editValue, setFooterStyles, storeId, onSaveEdit]);

  const handleEmailKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        setFooterStyles({ storeId, contactEmail: editValue });
        onSaveEdit();
      } else if (e.key === "Escape") {
        onSaveEdit();
      }
    },
    [editValue, setFooterStyles, storeId, onSaveEdit]
  );

  const handleCopyrightBlur = useCallback(async () => {
    await setFooterStyles({ storeId, copyright: editValue });
    onSaveEdit();
  }, [editValue, setFooterStyles, storeId, onSaveEdit]);

  const handleCopyrightKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        setFooterStyles({ storeId, copyright: editValue });
        onSaveEdit();
      } else if (e.key === "Escape") {
        onSaveEdit();
      }
    },
    [editValue, setFooterStyles, storeId, onSaveEdit]
  );

  const handleToggleSocial = useCallback(
    async (platform: string) => {
      const link = socialLinks.find((l) => l.platform === platform);
      const newLinks = link?.enabled
        ? socialLinks.filter((l) => l.platform !== platform)
        : [...socialLinks.filter((l) => l.platform !== platform), { platform, url: "", enabled: true }];
      await setFooterStyles({ storeId, socialLinks: newLinks });
    },
    [socialLinks, setFooterStyles, storeId]
  );

  return (
    <Card className="mb-6" padding="none">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">قسم الفوتر (Footer)</h2>
          <div className="text-xs text-[#737373]">المعاينة + التحرير</div>
        </div>

        <div className="border border-[#e5e5e5] dark:border-[#262626] bg-[#f5f5f5] dark:bg-[#171717] p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0a0a0a] overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                {footerLogoUrl ? (
                  <Image src={footerLogoUrl} alt="logo" fill className="object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-[#a3a3a3]" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">متجرك</div>
                <div className="text-xs text-[#737373]">الشعار مُزامَن من Navbar</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-[#171717] dark:text-[#fafafa] mb-2">معلومات التواصل</div>

              {/* Phone - Inline Edit */}
              {isEditingPhone ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onBlur={handlePhoneBlur}
                  onKeyDown={handlePhoneKeyDown}
                  className="w-full px-2 py-1 text-sm border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                  placeholder="رقم الهاتف"
                />
              ) : (
                <div
                  className="flex items-center gap-2 text-sm text-[#525252] dark:text-[#d4d4d4] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa]"
                  onClick={() => onStartEditing("footerPhone", contactPhone)}
                >
                  <span className="text-[#737373]">📱</span>
                  <span>{contactPhone || "أضف رقم الهاتف"}</span>
                </div>
              )}

              {/* Email - Inline Edit */}
              {isEditingEmail ? (
                <input
                  autoFocus
                  type="email"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  onKeyDown={handleEmailKeyDown}
                  className="w-full px-2 py-1 text-sm border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                  placeholder="البريد الإلكتروني"
                />
              ) : (
                <div
                  className="flex items-center gap-2 text-sm text-[#525252] dark:text-[#d4d4d4] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa]"
                  onClick={() => onStartEditing("footerEmail", contactEmail)}
                >
                  <span className="text-[#737373]">✉️</span>
                  <span>{contactEmail || "أضف البريد الإلكتروني"}</span>
                </div>
              )}
            </div>

            {/* Copyright */}
            <div className="flex items-center">
              {isEditingCopyright ? (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onBlur={handleCopyrightBlur}
                  onKeyDown={handleCopyrightKeyDown}
                  className="w-full px-2 py-1 text-sm border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                  placeholder="نص الحقوق"
                />
              ) : (
                <div
                  className="text-sm text-[#737373] cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                  onClick={() => onStartEditing("footerCopyright", copyright)}
                >
                  &copy; {copyright}
                </div>
              )}
            </div>
          </div>

          {/* Social Links Row */}
          <div className="mt-6 pt-4 border-t border-[#e5e5e5] dark:border-[#262626]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#737373]">روابط التواصل الاجتماعي</span>
              <div className="flex items-center gap-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const link = socialLinks.find((l) => l.platform === platform);
                  return (
                    <button
                      key={platform}
                      className={`w-8 h-8 flex items-center justify-center border ${
                        link?.enabled
                          ? "border-[#171717] dark:border-[#fafafa]"
                          : "border-[#e5e5e5] dark:border-[#262626]"
                      }`}
                      onClick={() => handleToggleSocial(platform)}
                      title={platform}
                    >
                      {platform === "facebook" && "f"}
                      {platform === "instagram" && "ig"}
                      {platform === "twitter" && "x"}
                      {platform === "whatsapp" && "wa"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

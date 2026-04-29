"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/primitives/core/inputs/input";
import { Textarea } from "@/components/primitives/core/inputs/textarea";
import { ImageCropper } from "@/components/features/shared";
import { useImageUpload } from "../hooks/use-image-upload";

interface StoreInfoSettingsProps {
  storeId: Id<"stores">;
  storeSlug: string;
}

type NavbarContentPreview = {
  logoUrl?: string;
} | null;

export function StoreInfoSettings({ storeId, storeSlug }: StoreInfoSettingsProps) {
  const store = useQuery(api.stores.getStoreBySlug, { slug: storeSlug });
  const navbarContent = useQuery(api.siteContent.getSiteContentResolved, {
    storeId,
    section: "navbar",
  }) as { content?: NavbarContentPreview } | null | undefined;
  const updateStore = useMutation(api.stores.updateStore);
  const setNavbarLogo = useMutation(api.siteContent.setNavbarLogo);
  const deleteNavbarLogo = useMutation(api.siteContent.deleteNavbarLogo);
  const { uploadToStorage } = useImageUpload();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [pendingLogoUpload, setPendingLogoUpload] = useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navbarLogoUrl = navbarContent?.content?.logoUrl;

  const prevStoreRef = useRef<typeof store>(undefined);
  useEffect(() => {
    if (store && store !== prevStoreRef.current) {
      prevStoreRef.current = store;
      setName(store.name || "");
      setDescription(store.description || "");
      setPhone(store.phone || "");
    }
  }, [store]);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setSavedMessage(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  useEffect(() => {
    if (!pendingLogoUpload) {
      return;
    }

    let active = true;
    setIsSavingLogo(true);
    setLogoError("");

    void (async () => {
      try {
        const storageId = await uploadToStorage(pendingLogoUpload);
        if (!active) return;

        await setNavbarLogo({ storeId, logoStorageId: storageId });
        if (!active) return;

        setSavedMessage(true);
      } catch {
        if (active) {
          setLogoError("Unable to update the icon. Please try again.");
        }
      } finally {
        if (active) {
          setIsSavingLogo(false);
          setPendingLogoUpload(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [pendingLogoUpload, setNavbarLogo, storeId, uploadToStorage]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateStore({ storeId, name, description, phone });
      setSavedMessage(true);
    } catch (error) {
      console.error("Failed to update store:", error);
    }
    setIsSaving(false);
  }, [updateStore, storeId, name, description, phone]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoError("");
      setLogoCropSrc(reader.result as string);
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleLogoCropComplete = (croppedImageUrl: string) => {
    setLogoCropSrc(null);
    setPendingLogoUpload(croppedImageUrl);
  };

  const handleRemoveLogo = async () => {
    setLogoError("");
    try {
      await deleteNavbarLogo({ storeId });
      setSavedMessage(true);
    } catch (error) {
      console.error("Failed to remove store logo:", error);
      setLogoError("Unable to remove the icon right now.");
    }
  };

  if (store === undefined || navbarContent === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-heading-sm text-[var(--system-50)]">Store Information</h3>
          <p className="mt-1 text-body-sm text-[var(--system-200)]">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-heading-sm text-[var(--system-50)]">Store Information</h3>
          <p className="mt-1 text-body-sm text-[var(--system-200)]">Store not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-sm text-[var(--system-50)]">Store Information</h3>
        <p className="mt-1 text-body-sm text-[var(--system-200)]">Basic information about your store</p>
      </div>

      <div className="rounded-[18px] border border-white/8 bg-[var(--system-700)] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-white/10">
            {navbarLogoUrl ? (
              <Image
                src={navbarLogoUrl}
                alt={`${store.name} icon`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-title text-white/70">{store.name?.charAt(0)?.toUpperCase() || "M"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-body-sm text-[var(--system-50)]">Browser icon</p>
            <p className="mt-1 text-caption text-[var(--system-200)]">
              This icon is used in the browser tab and storefront navbar.
            </p>

            {logoError ? (
              <p className="mt-3 text-caption text-[var(--color-error)]">{logoError}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSavingLogo}
                className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                {isSavingLogo ? "Updating..." : "Change icon"}
              </Button>

              {navbarLogoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveLogo}
                  disabled={isSavingLogo}
                  className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Remove icon
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="space-y-4">
        <Input
          id="store-name"
          type="text"
          label="Store Name"
          supportingText="This name is also used as the browser tab title."
          variant="dark"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter store name"
          showClearButton
        />

        <Textarea
          id="store-description"
          label="Description"
          variant="dark"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter store description"
          rows={3}
        />

        <Input
          id="store-phone"
          type="tel"
          label="Phone Number"
          variant="dark"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
          showClearButton
        />
      </div>

      <div className="rounded-lg bg-[var(--system-700)] p-4">
        <p className="mb-1 text-caption text-[var(--system-200)]">Store URL</p>
        <p className="text-body-sm text-[var(--system-50)]">marlon.com/{storeSlug}</p>
      </div>

      {savedMessage ? (
        <div className="rounded-lg bg-[var(--color-success-bg)] p-3 text-body-sm text-[var(--color-success)]">
          Changes saved successfully
        </div>
      ) : null}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>

      {logoCropSrc ? (
        <ImageCropper
          imageSrc={logoCropSrc}
          aspectRatio={1}
          onCropComplete={handleLogoCropComplete}
          onCancel={() => setLogoCropSrc(null)}
        />
      ) : null}
    </div>
  );
}

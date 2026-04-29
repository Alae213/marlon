"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageCropper } from "@/components/features/shared";
import { useImageUpload } from "@/components/pages/editor/hooks/use-image-upload";
import { api } from "@/convex/_generated/api";

type CreateStoreModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function generateSlug(inputName: string) {
  return inputName
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateSlug(inputSlug: string) {
  if (!inputSlug) return { valid: false, message: "URL is required" };
  if (inputSlug.length < 3) {
    return { valid: false, message: "URL must be at least 3 characters" };
  }
  if (inputSlug.length > 50) {
    return { valid: false, message: "URL must be less than 50 characters" };
  }
  if (!/^[a-z0-9-]+$/.test(inputSlug)) {
    return {
      valid: false,
      message: "URL can only contain lowercase letters, numbers, and hyphens",
    };
  }

  return { valid: true, message: "" };
}

const FORM_SHADOW =
  "0px 18px 30px rgba(0,0,0,0.28), inset 0px 1px 0px rgba(255,255,255,0.06)";

export function CreateStoreModal({ isOpen, onClose, onSuccess }: CreateStoreModalProps) {
  const { user } = useUser();
  const createStore = useMutation(api.stores.createStore);
  const { uploadToStorage } = useImageUpload();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoStorageId, setLogoStorageId] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slugAvailable = useQuery(
    api.stores.isSlugAvailable,
    slug ? { slug } : "skip"
  );

  const slugState = useMemo(() => validateSlug(slug), [slug]);
  const slugIsAvailable = slugAvailable !== false;
  const canSubmit = !isCreating && !isUploadingLogo;

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setError("");
      setHasSubmitted(false);
      setIsCreating(false);
      setLogoCropSrc(null);
      setLogoPreviewUrl(null);
      setLogoStorageId(null);
      setLogoError("");
      setIsUploadingLogo(false);
    }
  }, [isOpen]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(generateSlug(value));
    }
    if (hasSubmitted) {
      setError("");
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value.toLowerCase());
    if (hasSubmitted) {
      const validation = validateSlug(value.toLowerCase());
      setError(validation.valid ? "" : validation.message);
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
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

  const handleLogoCropComplete = async (croppedImageUrl: string) => {
    setLogoCropSrc(null);
    setIsUploadingLogo(true);
    setLogoError("");

    try {
      const storageId = await uploadToStorage(croppedImageUrl);
      setLogoStorageId(storageId);
      setLogoPreviewUrl(croppedImageUrl);
    } catch {
      setLogoError("Unable to upload the icon right now. Please try again.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCreate = async () => {
    setError("");
    setHasSubmitted(true);
    setIsCreating(true);

    if (!name.trim()) {
      setError("Please enter a store name");
      setIsCreating(false);
      return;
    }

    if (!slug.trim()) {
      setError("Please enter a store URL");
      setIsCreating(false);
      return;
    }

    if (!slugState.valid) {
      setError(slugState.message);
      setIsCreating(false);
      return;
    }

    if (!user) {
      setError("Please login first");
      setIsCreating(false);
      return;
    }

    if (!canSubmit) {
      setError("Please wait for the icon upload to finish.");
      setIsCreating(false);
      return;
    }

    try {
      if (slugAvailable === false) {
        setError("This URL is already taken. Please choose another one");
        setIsCreating(false);
        return;
      }

      await createStore({
        name,
        slug,
        description: "",
        logo: logoStorageId ?? undefined,
      });

      onSuccess();
      onClose();
    } catch {
      setError("An error occurred. Please try again");
    } finally {
      setIsCreating(false);
    }
  };

  const renderLogoShell = () =>
    logoPreviewUrl ? (
      <Image
        src={logoPreviewUrl}
        alt="Store favicon preview"
        width={80}
        height={80}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,rgba(255,255,255,0.11),rgba(255,255,255,0.03))]">
        <Plus className="h-5 w-5 text-white/70" />
      </div>
    );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/0"
        style={{ boxShadow: "var(--bottom-nav-shadow)" } as CSSProperties}
        className="max-w-[360px] gap-3 overflow-hidden rounded-[64px] border-white/10 bg-[--system-100] bg-[image:var(--gradient-popup)] p-5 text-white backdrop-blur-[12px] [corner-shape:squircle]"
      >
        <DialogHeader className="flex h-[58px] flex-row justify-between">
          <DialogTitle className="title-xl text-white">
            This is what people
            <br />
            will see.
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="-m-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10 active:scale-[0.96]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z"
                fill="white"
                fillOpacity="0.35"
              />
            </svg>
          </button>
        </DialogHeader>

        <hr
          className="h-px w-full rounded-full border-0"
          style={{
            background: "rgba(242, 242, 242, 0.30)",
            boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.30)",
          }}
        />

        <p className="body-base text-[var(--system-300)]">you can change it late</p>

        <div
          style={{ boxShadow: FORM_SHADOW }}
          className="flex flex-col gap-[11px] overflow-visible rounded-[22px] bg-white/10 p-3"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-[54px] w-full items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-3 text-left transition-colors hover:bg-black/25"
          >
            <div className="flex h-[36px] w-[36px] shrink-0 overflow-hidden rounded-[12px] border border-white/10 bg-white/10">
              {renderLogoShell()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-white">Browser icon</p>
              <p className="truncate text-caption text-[var(--system-300)]">
                Click the image to upload or change it.
              </p>
            </div>

            <span className="text-caption rounded-full border border-white/10 bg-white/8 px-3 py-1 text-white/80">
              Upload
            </span>
          </button>

          <div className="flex h-[27px] w-full flex-row items-center gap-4">
            <Image src="/windw.svg" alt="Website" width={33} height={9} />
            <div className="flex w-full flex-row items-center gap-2">
              <div className="flex h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[12px] border border-white/10 bg-white/10">
                {renderLogoShell()}
              </div>

              <input
                type="text"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Type . . ."
                className={`body-base h-8 w-full rounded-[10px] border bg-transparent px-1 py-1 text-[var(--system-100)] placeholder-[var(--system-300)] transition-colors duration-300 ease-in-out hover:bg-white/10 focus:bg-white/5 focus:outline-none ${
                  hasSubmitted && !name ? "border-red-500" : "border-white/0"
                }`}
                autoFocus
                aria-label="Website name"
              />
            </div>
          </div>

          <div className="h-8">
            <div className="flex items-center gap-2">
              <span className="body-base text-[var(--system-200)]">marlon.app/</span>
              <div className="relative w-full">
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  className={`h-8 bg-black/30 px-3 py-2 ${
                    hasSubmitted && (error || !slug) ? "border-red-500" : "border-white/0"
                  }`}
                  placeholder="my-website"
                />
                {slug ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {slugState.valid && slugIsAvailable ? (
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {logoError ? (
            <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3 text-caption text-amber-100">
              {logoError}
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">Please fix the following:</p>
                <p>{error}</p>
              </div>
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />

        <div className="h-6" />

        <div className="flex w-full gap-3">
          <Button variant="ghost" size="md" onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canSubmit || isCreating}
            size="md"
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </DialogContent>

      {logoCropSrc ? (
        <ImageCropper
          imageSrc={logoCropSrc}
          aspectRatio={1}
          onCropComplete={handleLogoCropComplete}
          onCancel={() => setLogoCropSrc(null)}
        />
      ) : null}
    </Dialog>
  );
}

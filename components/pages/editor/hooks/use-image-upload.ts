"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Converts a data URL (base64) to a Blob.
 * Avoids fetch() which is blocked by CSP for data: URLs.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const base64Data = dataUrl.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array<number>(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  const mimeMatch = dataUrl.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  return new Blob([byteArray], { type: mimeType });
}

/**
 * Fetches a blob from a regular URL.
 */
async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to read image data: ${res.status}`);
  return res.blob();
}

/**
 * Custom hook for uploading images to Convex storage.
 *
 * Provides:
 * - uploadToStorage: uploads a single data URL or image URL, returns storageId
 * - resolveImageStorageIds: batch-resolves an array of images (uploads new base64 ones, passes through existing storageIds/URLs)
 */
export function useImageUpload() {
  const generateUploadUrl = useMutation(api.siteContent.generateUploadUrl);

  const uploadToStorage = async (dataUrl: string): Promise<Id<"_storage">> => {
    // Step 1: Get upload URL from Convex
    const uploadUrl = await generateUploadUrl({});
    if (!uploadUrl) {
      throw new Error("No upload URL returned from Convex — is the Convex dev server running?");
    }

    // Step 2: Convert to blob
    const blob = dataUrl.startsWith("data:")
      ? dataUrlToBlob(dataUrl)
      : await urlToBlob(dataUrl);

    // Step 3: Upload to Convex storage
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type || "image/jpeg" },
      body: blob,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload failed: ${res.status} — ${errorText}`);
    }

    const json = await res.json();
    return json.storageId as Id<"_storage">;
  };

  /**
   * Resolves an array of image sources.
   * - data: URLs → uploaded to Convex storage, returns storageId
   * - Everything else (existing storageIds or URLs) → passed through unchanged
   */
  const resolveImageStorageIds = async (images: string[]): Promise<string[]> => {
    return Promise.all(
      images.map((img) =>
        img.startsWith("data:") ? uploadToStorage(img) : img
      )
    );
  };

  return { uploadToStorage, resolveImageStorageIds };
}

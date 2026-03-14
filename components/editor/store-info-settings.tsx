"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";

interface StoreInfoSettingsProps {
  storeId: Id<"stores">;
  storeSlug: string;
}

export function StoreInfoSettings({ storeId, storeSlug }: StoreInfoSettingsProps) {
  const store = useQuery(api.stores.getStoreBySlug, { slug: storeSlug });
  const updateStore = useMutation(api.stores.updateStore);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // Sync state when query data arrives (only when data actually changes)
  const prevStoreRef = useRef<typeof store>(undefined);
  useEffect(() => {
    if (store && store !== prevStoreRef.current) {
      prevStoreRef.current = store;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing Convex reactive query to form state
      setName(store.name || "");
      setDescription(store.description || "");
      setPhone(store.phone || "");
    }
  }, [store]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateStore({ storeId, name, description, phone });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to update store:", error);
    }
    setIsSaving(false);
  }, [updateStore, storeId, name, description, phone]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-[#171717] dark:text-[#fafafa]">Store Information</h3>
        <p className="text-sm text-[#737373] mt-1">Basic information about your store</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-[#525252] dark:text-[#d4d4d4]">Store Name</label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter store name" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#525252] dark:text-[#d4d4d4]">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter store description"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#525252] dark:text-[#d4d4d4]">Phone Number</label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
        </div>
      </div>

      <div className="p-4 bg-[#f5f5f5] dark:bg-[#171717] rounded-xl border border-[#e5e5e5] dark:border-[#262626]">
        <p className="text-xs text-[#737373] mb-1">Store URL</p>
        <p className="font-medium text-[#171717] dark:text-[#fafafa]">marlon.com/{storeSlug}</p>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
          ✓ Changes saved successfully
        </div>
      )}

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

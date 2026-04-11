"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/primitives/core/buttons/button";
import { Input } from "@/components/primitives/core/inputs/input";
import { Textarea } from "@/components/primitives/core/inputs/textarea";

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
        <h3 className="font-semibold text-[--system-700]">Store Information</h3>
        <p className="text-sm text-[--system-400] mt-1">Basic information about your store</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-[--system-500]">Store Name</label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter store name" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[--system-500]">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter store description"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[--system-500]">Phone Number</label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
        </div>
      </div>

      <div className="p-4 bg-[--system-100] rounded-xl border border-[--system-200]">
        <p className="text-xs text-[--system-400] mb-1">Store URL</p>
        <p className="font-medium text-[--system-700]">marlon.com/{storeSlug}</p>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-lg bg-[--color-success-bg] text-[--color-success] text-sm font-medium">
          ✓ Changes saved successfully
        </div>
      )}

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

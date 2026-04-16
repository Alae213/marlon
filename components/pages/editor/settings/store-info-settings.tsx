"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
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
        <h3 className="text-heading-sm text-[var(--system-50)]">Store Information</h3>
        <p className="mt-1 text-body-sm text-[var(--system-200)]">Basic information about your store</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="store-name" className="mb-2 block text-body-sm text-[var(--system-100)]">Store Name</label>
          <div className="rounded-[var(--radius-md)] bg-[var(--system-600)] p-[2px]">
            <Input id="store-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter store name" />
          </div>
        </div>

        <div>
          <label htmlFor="store-description" className="mb-2 block text-body-sm text-[var(--system-100)]">Description</label>
          <div className="rounded-[var(--radius-md)] bg-[var(--system-600)] p-[2px]">
            <Textarea
              id="store-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter store description"
              rows={3}
            />
          </div>
        </div>

        <div>
          <label htmlFor="store-phone" className="mb-2 block text-body-sm text-[var(--system-100)]">Phone Number</label>
          <div className="rounded-[var(--radius-md)] bg-[var(--system-600)] p-[2px]">
            <Input id="store-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--system-700)] p-[var(--spacing-md)]">
        <p className="mb-1 text-caption text-[var(--system-200)]">Store URL</p>
        <p className="text-body-sm text-[var(--system-50)]">marlon.com/{storeSlug}</p>
      </div>

      {savedMessage && (
        <div className="rounded-lg bg-[var(--color-success-bg)] p-3 text-body-sm text-[var(--color-success)]">
          Changes saved successfully
        </div>
      )}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type JsonValue = unknown;

async function postJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }

  return (await response.json()) as TResponse;
}

export function MigrationsDashboard() {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [storeId, setStoreId] = useState("");
  const [preview, setPreview] = useState<JsonValue>(null);
  const [reconcile, setReconcile] = useState<JsonValue>(null);
  const [fixupsDryRun, setFixupsDryRun] = useState<JsonValue>(null);
  const [fixupsApplied, setFixupsApplied] = useState<JsonValue>(null);
  const [backfill, setBackfill] = useState<JsonValue>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedStoreId = useMemo(() => storeId.trim(), [storeId]);

  async function runAction<T>(key: string, fn: () => Promise<T>, onDone: (result: T) => void) {
    setError(null);
    setBusyAction(key);
    try {
      const result = await fn();
      onDone(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-10">
      <div className="space-y-1">
        <h1 className="text-title text-[var(--system-700)]">Internal: Canonical Billing Migrations</h1>
        <p className="text-body text-[var(--system-500)]">
          Operator-only tools for backfill, reconciliation, and safe parity fix-ups.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-body text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border bg-white p-4">
        <label className="text-micro-label text-[var(--system-500)]">
          Optional storeId (to reconcile a single store)
        </label>
        <input
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
          placeholder="storeId..."
          className="h-10 w-full rounded-lg border border-[var(--system-200)] bg-white px-3 text-body text-[var(--system-700)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={busyAction !== null}
          onClick={() =>
            runAction(
              "preview",
              () => postJson("/api/_internal/migrations/preview"),
              (result) => setPreview(result),
            )
          }
        >
          {busyAction === "preview" ? "Loading..." : "Preview state"}
        </Button>

        <Button
          disabled={busyAction !== null}
          variant="outline"
          onClick={() =>
            runAction(
              "backfill",
              () => postJson("/api/_internal/migrations/start-backfill", { batchSize: 100 }),
              (result) => setBackfill(result),
            )
          }
        >
          {busyAction === "backfill" ? "Starting..." : "Start backfill"}
        </Button>

        <Button
          disabled={busyAction !== null}
          variant="outline"
          onClick={() =>
            runAction(
              "reconcile",
              () =>
                postJson("/api/_internal/migrations/reconcile", {
                  storeId: trimmedStoreId || undefined,
                  batchSize: 50,
                }),
              (result) => setReconcile(result),
            )
          }
        >
          {busyAction === "reconcile" ? "Running..." : "Run reconciliation"}
        </Button>

        <Button
          disabled={busyAction !== null}
          variant="outline"
          onClick={() =>
            runAction(
              "fixups-dry",
              () => postJson("/api/_internal/migrations/fixups", { batchSize: 100, dryRun: true }),
              (result) => setFixupsDryRun(result),
            )
          }
        >
          {busyAction === "fixups-dry" ? "Running..." : "Dry-run fix-ups"}
        </Button>

        <Button
          disabled={busyAction !== null}
          onClick={() =>
            runAction(
              "fixups-apply",
              () => postJson("/api/_internal/migrations/fixups", { batchSize: 100, dryRun: false }),
              (result) => setFixupsApplied(result),
            )
          }
        >
          {busyAction === "fixups-apply" ? "Applying..." : "Apply fix-ups"}
        </Button>
      </div>

      <ResultPanel title="Preview" value={preview} />
      <ResultPanel title="Backfill" value={backfill} />
      <ResultPanel title="Reconciliation" value={reconcile} />
      <ResultPanel title="Fix-ups (dry run)" value={fixupsDryRun} />
      <ResultPanel title="Fix-ups (applied)" value={fixupsApplied} />
    </div>
  );
}

function ResultPanel({ title, value }: { title: string; value: JsonValue }) {
  return (
    <section className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-micro-label text-[var(--system-700)]">{title}</h2>
      </div>
      {value ? (
        <pre className="max-h-[420px] overflow-auto rounded-xl bg-[var(--system-50)] p-3 text-[12px] leading-5 text-[var(--system-700)]">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="text-body text-[var(--system-400)]">No results yet.</p>
      )}
    </section>
  );
}


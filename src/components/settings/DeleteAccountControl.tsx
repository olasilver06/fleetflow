"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CONFIRM_TEXT = "DELETE";

export default function DeleteAccountControl() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't delete your account.");
        setSubmitting(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-danger px-4 py-2 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-text-secondary text-sm">
        Type <span className="font-mono text-text-primary">{CONFIRM_TEXT}</span>{" "}
        to confirm. This can&apos;t be undone from your side.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={CONFIRM_TEXT}
        disabled={submitting}
        className="w-full max-w-xs rounded-lg bg-surface border border-border px-4 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-danger disabled:opacity-60"
      />

      {errorMessage && (
        <p className="text-danger text-sm" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={confirmText !== CONFIRM_TEXT || submitting}
          className="rounded-lg bg-danger px-4 py-2 text-white text-sm font-medium hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          {submitting ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setConfirmText("");
            setErrorMessage(null);
          }}
          disabled={submitting}
          className="rounded-lg border border-border px-4 py-2 text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateZoneForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [baseFee, setBaseFee] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseFee: parseFloat(baseFee) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't create zone. Try again.");
        setSubmitting(false);
        return;
      }

      setName("");
      setBaseFee("");
      router.refresh();
      setSubmitting(false);
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-start sm:items-end gap-3"
    >
      <div className="flex-1 w-full">
        <label className="text-text-secondary text-xs mb-1 block">Zone name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
          className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
        />
      </div>
      <div className="w-full sm:w-40">
        <label className="text-text-secondary text-xs mb-1 block">Base fee (₦)</label>
        <input
          type="number"
          step="any"
          value={baseFee}
          onChange={(e) => setBaseFee(e.target.value)}
          required
          disabled={submitting}
          className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary px-4 py-2.5 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
      >
        {submitting ? "Creating…" : "Create zone"}
      </button>
      {errorMessage && (
        <p className="text-danger text-xs w-full" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

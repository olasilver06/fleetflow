"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rider = { id: string; name: string };

export default function AssignRiderControl({
  orderId,
  riders,
}: {
  orderId: string;
  riders: Rider[];
}) {
  const router = useRouter();
  const [riderId, setRiderId] = useState(riders[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAssign() {
    if (!riderId) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't assign rider. Try again.");
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        <select
          value={riderId}
          onChange={(e) => setRiderId(e.target.value)}
          disabled={riders.length === 0 || submitting}
          className="rounded-lg bg-surface border border-border px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
        >
          {riders.length === 0 && <option value="">No riders available</option>}
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAssign}
          disabled={!riderId || submitting}
          className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {submitting ? "Assigning…" : "Assign"}
        </button>
      </div>
      {errorMessage && (
        <p className="text-danger text-xs" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

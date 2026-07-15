"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RiderVerificationControl({ riderId }: { riderId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAction(status: "APPROVED" | "REJECTED") {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/riders/${riderId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't update rider status. Try again.");
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
        <button
          type="button"
          onClick={() => handleAction("APPROVED")}
          disabled={submitting}
          className="rounded-lg bg-primary px-3 py-1.5 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => handleAction("REJECTED")}
          disabled={submitting}
          className="rounded-lg bg-danger px-3 py-1.5 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-danger/90 transition-colors"
        >
          Reject
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

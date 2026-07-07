"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";

type Action = { label: string; target: OrderStatus; variant?: "primary" | "danger" };

const ACTIONS: Partial<Record<OrderStatus, Action[]>> = {
  ASSIGNED: [
    { label: "Accept", target: "RIDER_ACCEPTED", variant: "primary" },
    { label: "Reject", target: "REJECTED_BY_RIDER", variant: "danger" },
  ],
  RIDER_ACCEPTED: [{ label: "Mark picked up", target: "PICKED_UP", variant: "primary" }],
  PICKED_UP: [{ label: "Start delivery", target: "IN_TRANSIT", variant: "primary" }],
};

export default function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [recipientName, setRecipientName] = useState("");

  async function handleAction(target: OrderStatus) {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't update status. Try again.");
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  async function handleConfirmDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      if (recipientName.trim()) {
        formData.append("recipientName", recipientName.trim());
      }

      const res = await fetch(`/api/orders/${orderId}/proof`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't confirm delivery. Try again.");
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (status === "IN_TRANSIT") {
    return (
      <form
        onSubmit={handleConfirmDelivery}
        className="flex flex-col items-end gap-2 shrink-0 w-64"
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          disabled={submitting}
          required
          className="w-full text-xs text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-white file:text-sm file:font-medium disabled:opacity-40"
        />
        <input
          type="text"
          placeholder="Recipient name (optional)"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          disabled={submitting}
          className="w-full rounded-lg bg-surface border border-border px-3 py-2 text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!photo || submitting}
          className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {submitting ? "Uploading…" : "Confirm delivery"}
        </button>
        {errorMessage && (
          <p className="text-danger text-xs" role="alert">
            {errorMessage}
          </p>
        )}
      </form>
    );
  }

  const actions = ACTIONS[status] ?? [];

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.target}
            type="button"
            onClick={() => handleAction(action.target)}
            disabled={submitting}
            className={
              action.variant === "danger"
                ? "rounded-lg bg-danger px-4 py-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-danger/90 transition-colors"
                : "rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            }
          >
            {submitting ? "Updating…" : action.label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <p className="text-danger text-xs" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

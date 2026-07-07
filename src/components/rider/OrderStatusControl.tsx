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
  IN_TRANSIT: [{ label: "Mark delivered", target: "DELIVERED", variant: "primary" }],
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

  const actions = ACTIONS[status] ?? [];

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

      {status === "IN_TRANSIT" && (
        <p className="text-text-secondary text-xs">
          Proof of delivery upload not yet implemented
        </p>
      )}

      {errorMessage && (
        <p className="text-danger text-xs" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

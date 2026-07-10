"use client";

import { useEffect, useRef, useState } from "react";
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

const LOCATION_PING_INTERVAL_MS = 10000;

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

  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);

  function clearLocationWatch() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  // Stop sharing on unmount, and also if the order moves past IN_TRANSIT
  // while this component stays mounted (e.g. after confirming delivery).
  useEffect(() => {
    return () => clearLocationWatch();
  }, []);

  useEffect(() => {
    // The IN_TRANSIT branch below is the only place this toggle renders, so
    // once status moves on there's nothing left to reflect in state — just
    // stop the actual GPS watch so it doesn't keep polling/POSTing.
    if (status !== "IN_TRANSIT") {
      clearLocationWatch();
    }
  }, [status]);

  function startSharingLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation isn't supported on this device.");
      return;
    }

    setLocationError(null);
    lastSentAtRef.current = 0;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentAtRef.current < LOCATION_PING_INTERVAL_MS) return;
        lastSentAtRef.current = now;

        fetch("/api/rider-locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
          }),
        }).catch(() => {
          // Best-effort ping — a single dropped update isn't worth interrupting the rider.
        });
      },
      (error) => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. Enable location access to share your position."
            : "Couldn't get your location. Try again."
        );
        clearLocationWatch();
        setSharingLocation(false);
      },
      { enableHighAccuracy: true }
    );

    watchIdRef.current = watchId;
    setSharingLocation(true);
  }

  function toggleSharingLocation() {
    if (sharingLocation) {
      clearLocationWatch();
      setSharingLocation(false);
    } else {
      startSharingLocation();
    }
  }

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
      <div className="flex flex-col items-end gap-3 shrink-0 w-64">
        <div className="flex flex-col items-end gap-1 w-full">
          <button
            type="button"
            onClick={toggleSharingLocation}
            className={
              sharingLocation
                ? "w-full flex items-center justify-center gap-2 rounded-lg bg-surface border border-border px-3 py-2 text-text-primary text-sm font-medium hover:bg-surface-hover transition-colors"
                : "w-full rounded-lg bg-primary px-3 py-2 text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            }
          >
            {sharingLocation && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            )}
            {sharingLocation ? "Sharing location" : "Share live location"}
          </button>
          {locationError && (
            <p className="text-danger text-xs" role="alert">
              {locationError}
            </p>
          )}
        </div>

        <form onSubmit={handleConfirmDelivery} className="flex flex-col items-end gap-2 w-full">
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
      </div>
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

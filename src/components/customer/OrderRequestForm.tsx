"use client";

import { useState } from "react";
import Link from "next/link";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function OrderRequestForm() {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLat, setDropoffLat] = useState("");
  const [dropoffLng, setDropoffLng] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const isReadyToSubmit =
    pickupAddress.trim() &&
    pickupLat &&
    pickupLng &&
    dropoffAddress.trim() &&
    dropoffLat &&
    dropoffLng;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress,
          pickupLat: parseFloat(pickupLat),
          pickupLng: parseFloat(pickupLng),
          dropoffAddress,
          dropoffLat: parseFloat(dropoffLat),
          dropoffLng: parseFloat(dropoffLng),
          packageDescription: packageDescription || undefined,
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Something went wrong. Try again.");
        setState("error");
        return;
      }

      setOrderNumber(data.orderNumber);
      setState("success");
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="max-w-md mx-auto rounded-xl border border-border bg-surface p-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-success text-sm font-mono mb-4">
          <span className="h-2 w-2 rounded-full bg-success" />
          CONFIRMED
        </div>
        <p className="text-text-primary text-lg mb-1">Delivery requested</p>
        <p className="font-mono text-2xl text-text-primary mb-4">{orderNumber}</p>
        <p className="text-text-secondary text-sm">
          You&apos;ll be able to track this delivery once a rider is assigned.
        </p>
        <Link
          href="/orders"
          className="inline-block mt-6 text-primary text-sm font-medium hover:underline"
        >
          My orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-[1.2fr_1fr]">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-text-primary font-medium mb-2">Pickup</legend>
          <input
            type="text"
            placeholder="Pickup address"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={pickupLat}
              onChange={(e) => setPickupLat(e.target.value)}
              className="rounded-lg bg-surface border border-border px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-secondary placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={pickupLng}
              onChange={(e) => setPickupLng(e.target.value)}
              className="rounded-lg bg-surface border border-border px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-secondary placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-text-primary font-medium mb-2">Drop-off</legend>
          <input
            type="text"
            placeholder="Drop-off address"
            value={dropoffAddress}
            onChange={(e) => setDropoffAddress(e.target.value)}
            className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={dropoffLat}
              onChange={(e) => setDropoffLat(e.target.value)}
              className="rounded-lg bg-surface border border-border px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-secondary placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={dropoffLng}
              onChange={(e) => setDropoffLng(e.target.value)}
              className="rounded-lg bg-surface border border-border px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-secondary placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-text-primary font-medium mb-2">Package</legend>
          <textarea
            placeholder="What are you sending? (optional)"
            value={packageDescription}
            onChange={(e) => setPackageDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <input
            type="number"
            step="any"
            placeholder="Weight in kg (optional)"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </fieldset>

        {state === "error" && (
          <p className="text-danger text-sm" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!isReadyToSubmit || state === "submitting"}
          className="w-full rounded-lg bg-primary py-3 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {state === "submitting" ? "Requesting…" : "Request delivery"}
        </button>
      </form>

      {/* Live dispatch ticket preview — the signature element */}
      <div className="rounded-xl border border-border bg-surface p-6 h-fit sticky top-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <span className="font-mono text-xs text-text-secondary">DISPATCH TICKET</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2 py-0.5 text-warning text-xs font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            PENDING
          </span>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-text-secondary text-xs mb-0.5">FROM</dt>
            <dd className="text-text-primary">{pickupAddress || "—"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary text-xs mb-0.5">TO</dt>
            <dd className="text-text-primary">{dropoffAddress || "—"}</dd>
          </div>
          <div>
            <dt className="text-text-secondary text-xs mb-0.5">PACKAGE</dt>
            <dd className="text-text-primary">
              {packageDescription || "—"}
              {weightKg && <span className="text-text-secondary"> · {weightKg}kg</span>}
            </dd>
          </div>
        </dl>

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-text-secondary text-xs">ORDER NO.</span>
          <span className="font-mono text-text-secondary text-sm">
            FF-{new Date().getFullYear()}-••••••
          </span>
        </div>
      </div>
    </div>
  );
}

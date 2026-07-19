"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Bike } from "lucide-react";

const VEHICLE_TYPES = ["BIKE", "VAN", "TRUCK"] as const;

export default function CompleteProfileForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState<"CUSTOMER" | "RIDER">("CUSTOMER");
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]>("BIKE");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/users/complete-google-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          vehicleType: role === "RIDER" ? vehicleType : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error ?? "Couldn't finish setting up your account.");
        setSubmitting(false);
        return;
      }

      router.push(role === "RIDER" ? "/rider-signup/pending" : "/request");
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-text-primary text-2xl font-medium mb-1">Complete your profile</h1>
        <p className="text-text-secondary text-sm mb-6">
          Just a couple more details before you get started.
        </p>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("CUSTOMER")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              role === "CUSTOMER"
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <Package className="h-6 w-6 text-primary mb-2" />
            <p className="text-text-primary font-medium text-sm">I need deliveries</p>
          </button>
          <button
            type="button"
            onClick={() => setRole("RIDER")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              role === "RIDER"
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <Bike className="h-6 w-6 text-accent mb-2" />
            <p className="text-text-primary font-medium text-sm">I want to ride for FleetFlow</p>
          </button>
        </div>

        {role === "RIDER" && (
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as (typeof VEHICLE_TYPES)[number])}
            className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        )}

        {errorMessage && (
          <p className="text-danger text-sm" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}

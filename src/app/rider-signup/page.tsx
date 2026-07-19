"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const VEHICLE_TYPES = ["BIKE", "VAN", "TRUCK"] as const;

export default function RiderSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]>("BIKE");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      setInfoMessage("Check your email to confirm your account, then log in.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/riders/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, vehicleType }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErrorMessage(data?.error ?? "Couldn't finish setting up your account.");
      setSubmitting(false);
      return;
    }

    router.push("/rider-signup/pending");
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <Image src="/hero-rider.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background/50" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm space-y-4 rounded-xl border border-border bg-surface/95 backdrop-blur p-8 shadow-xl"
      >
        <h1 className="text-text-primary text-2xl font-medium mb-6">Rider sign up</h1>

        <GoogleSignInButton onError={setErrorMessage} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-text-secondary text-xs uppercase tracking-wide">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <PasswordInput placeholder="Password" value={password} onChange={setPassword} required />
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

        {errorMessage && (
          <p className="text-danger text-sm" role="alert">
            {errorMessage}
          </p>
        )}
        {infoMessage && <p className="text-text-secondary text-sm">{infoMessage}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-3 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {submitting ? "Signing up…" : "Sign up"}
        </button>
      </form>
    </main>
  );
}

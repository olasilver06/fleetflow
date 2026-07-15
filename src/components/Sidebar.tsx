"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "CUSTOMER" | "ADMIN" | "RIDER" | null;

function loginRedirect(path: string) {
  return `/login?redirect=${encodeURIComponent(path)}`;
}

const linkClass =
  "block rounded-lg px-4 py-3 text-sm text-text-primary hover:bg-surface-hover transition-colors";

// The panel stays mounted (just translated off-screen) so the slide-in
// transition has something to animate from — unlike the old dropdown,
// which only rendered its links while open. That means every link here
// is in the DOM on every page load; prefetch={false} keeps Next.js from
// eagerly prefetching all of them in the background while the panel is
// closed, which is what a normal <Link> would otherwise do.

function TrackOrderControl({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/lookup?orderNumber=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setError("Order not found.");
        return;
      }
      const data = await res.json();
      setOrderNumber("");
      setOpen(false);
      onNavigate();
      router.push(`/orders/${data.id}/track`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`${linkClass} flex w-full items-center justify-between text-left`}
      >
        Track an order
        <Search className="h-4 w-4 text-text-secondary" aria-hidden="true" />
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="space-y-2 px-4 pb-3">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Order number"
            disabled={submitting}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
          {error && (
            <p className="text-danger text-xs" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Tracking…" : "Track"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function Sidebar({
  role,
  isOpen,
  onClose,
}: {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-xs flex-col border-l border-border bg-surface shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <p className="text-text-primary font-medium">Menu</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {role === null && (
            <>
              <Link href="/join" onClick={onClose} className={linkClass} prefetch={false}>
                Sign up
              </Link>
              <Link href="/login" onClick={onClose} className={linkClass} prefetch={false}>
                Sign in
              </Link>
              <Link href={loginRedirect("/orders")} onClick={onClose} className={linkClass} prefetch={false}>
                Track Orders
              </Link>
              <Link href={loginRedirect("/request")} onClick={onClose} className={linkClass} prefetch={false}>
                Request a Delivery
              </Link>
              <Link href="/#how-it-works" onClick={onClose} className={linkClass} prefetch={false}>
                How it works
              </Link>
              <Link href="/#why-fleetflow" onClick={onClose} className={linkClass} prefetch={false}>
                Why FleetFlow
              </Link>
              <Link href="/about" onClick={onClose} className={linkClass} prefetch={false}>
                About
              </Link>
              <Link href="/rider-signup" onClick={onClose} className={linkClass} prefetch={false}>
                Become a rider
              </Link>
            </>
          )}

          {role === "CUSTOMER" && (
            <>
              <TrackOrderControl onNavigate={onClose} />
              <Link href="/orders" onClick={onClose} className={linkClass} prefetch={false}>
                My Orders
              </Link>
              <Link href="/account" onClick={onClose} className={linkClass} prefetch={false}>
                Account
              </Link>
              <Link href="/settings" onClick={onClose} className={linkClass} prefetch={false}>
                Settings
              </Link>
            </>
          )}

          {role === "RIDER" && (
            <>
              <Link href="/account" onClick={onClose} className={linkClass} prefetch={false}>
                Profile
              </Link>
              <Link href="/rider/jobs" onClick={onClose} className={linkClass} prefetch={false}>
                Jobs
              </Link>
              <Link href="/settings" onClick={onClose} className={linkClass} prefetch={false}>
                Settings
              </Link>
            </>
          )}

          {role === "ADMIN" && (
            <>
              <Link href="/admin/dashboard" onClick={onClose} className={linkClass} prefetch={false}>
                Dashboard
              </Link>
              <Link href="/admin/orders" onClick={onClose} className={linkClass} prefetch={false}>
                Orders
              </Link>
              <Link href="/admin/zones" onClick={onClose} className={linkClass} prefetch={false}>
                Zones
              </Link>
              <Link href="/admin/riders" onClick={onClose} className={linkClass} prefetch={false}>
                Riders
              </Link>
              <TrackOrderControl onNavigate={onClose} />
              <Link href="/settings" onClick={onClose} className={linkClass} prefetch={false}>
                Settings
              </Link>
            </>
          )}
        </nav>

        {role !== null && (
          <div className="shrink-0 border-t border-border p-3">
            <button type="button" onClick={handleSignOut} className={`${linkClass} w-full text-left`}>
              Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

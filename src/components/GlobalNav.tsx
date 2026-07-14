"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Settings, CircleUser } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import FleetFlowLogo from "@/components/FleetFlowLogo";
import ThemeToggle from "@/components/ThemeToggle";

type Role = "CUSTOMER" | "ADMIN" | "RIDER";

const ROLE_LINKS: Record<Role, { href: string; label: string }[]> = {
  CUSTOMER: [{ href: "/orders", label: "Track Orders" }],
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/zones", label: "Zones" },
    { href: "/admin/riders", label: "Riders" },
  ],
  RIDER: [{ href: "/rider/jobs", label: "Jobs" }],
};

export default function GlobalNav() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // /api/users/me wraps getCurrentUser() — the client can't derive role
    // from the Supabase session alone, since role lives on our Prisma User
    // row, not the auth session.
    function refreshRole() {
      fetch("/api/users/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setRole(data?.role ?? null))
        .catch(() => setRole(null));
    }

    refreshRole();

    // GlobalNav lives in the root layout, so it mounts once for the whole
    // session instead of once per page like the old per-page navs did —
    // a plain mount-only fetch would go stale the moment someone logs in
    // or out via a client-side router.push and never re-fetches. Reacting
    // to Supabase's own auth events keeps it in sync without a hard reload.
    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const orderNumber = searchValue.trim();
    if (!orderNumber) return;

    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}`);
      if (!res.ok) {
        setSearchError("Order not found.");
        return;
      }
      const data = await res.json();
      setMobileSearchOpen(false);
      setSearchValue("");
      router.push(`/orders/${data.id}/track`);
    } catch {
      setSearchError("Couldn't reach the server.");
    } finally {
      setSearching(false);
    }
  }

  const searchInput = (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search order number..."
        disabled={searching}
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
      />
    </div>
  );

  return (
    <header className="border-b border-border bg-surface px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <Link href="/" className="shrink-0">
          <FleetFlowLogo className="w-32 h-auto" />
        </Link>

        <form onSubmit={handleSearchSubmit} className="mx-auto hidden w-full max-w-md sm:block">
          {searchInput}
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-4 sm:ml-0">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Search orders"
            className="text-text-secondary hover:text-text-primary transition-colors sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
          <ThemeToggle />
          <Settings className="h-5 w-5 text-text-secondary" aria-hidden="true" />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <CircleUser className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
                {role ? (
                  <>
                    {ROLE_LINKS[role].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/join"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      Sign up
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileSearchOpen && (
        <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto mt-3 sm:hidden">
          {searchInput}
        </form>
      )}

      {searchError && (
        <p className="max-w-4xl mx-auto mt-2 text-xs text-danger">{searchError}</p>
      )}
    </header>
  );
}

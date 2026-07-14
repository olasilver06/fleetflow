"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUser } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "CUSTOMER" | "ADMIN" | "RIDER";

const PRIMARY_LINK: Record<Role, { href: string; label: string }> = {
  CUSTOMER: { href: "/request", label: "Request a delivery" },
  ADMIN: { href: "/admin/dashboard", label: "Dashboard" },
  RIDER: { href: "/rider/jobs", label: "Jobs" },
};

export default function AccountMenu({ role }: { role: Role | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <CircleUser className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg py-1 z-20">
          {role ? (
            <>
              <Link
                href={PRIMARY_LINK[role].href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
              >
                {PRIMARY_LINK[role].label}
              </Link>
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
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

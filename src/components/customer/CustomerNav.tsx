"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CustomerNav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-surface px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fleetflow-horizontal-lockup.svg" alt="FleetFlow" width={140} height={34} />
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/orders"
            className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
          >
            Track Orders
          </Link>
          {isLoggedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

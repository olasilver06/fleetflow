"use client";

import { useState } from "react";
import GoogleIcon from "@/components/GoogleIcon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // On success, Supabase navigates the browser to Google — there's
    // nothing left to do here. Only reset state if the call itself failed
    // before ever redirecting (e.g. Google isn't enabled on the project).
    if (error) {
      onError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-surface py-3 text-text-primary font-medium hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <GoogleIcon className="h-4 w-4" />
      {submitting ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

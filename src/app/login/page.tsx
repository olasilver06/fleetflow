"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Read via window.location instead of useSearchParams so this page
    // doesn't need a Suspense boundary just for a one-off flash message.
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off flash message derived from the URL, not state synced from React.
      setSuccessMessage("Password reset successful. Log in with your new password.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage(error.message);
        setSubmitting(false);
        return;
      }

      // Route by role — /login is shared across all three roles, so it can't
      // always send people to the customer request form (that was the bug:
      // admins/riders logging in used to land on /request regardless).
      const res = await fetch("/api/users/me");
      const role = res.ok ? (await res.json()).role : null;

      // Sidebar links for anonymous visitors send them here with
      // ?redirect=<path> so login returns them to what they actually
      // clicked, not just their role's default landing page. Only accept
      // a same-site path — "//evil.com" or "/\evil.com" both parse as
      // protocol-relative URLs in some browsers despite starting with "/".
      const redirectParam = new URLSearchParams(window.location.search).get("redirect");
      const isSafeRedirect =
        !!redirectParam && redirectParam.startsWith("/") && !/^\/[\\/]/.test(redirectParam);

      const destination = isSafeRedirect
        ? redirectParam
        : role === "ADMIN"
          ? "/admin/dashboard"
          : role === "RIDER"
            ? "/rider/jobs"
            : "/request";
      router.push(destination);
    } catch {
      // Without this, an unexpected failure here (e.g. the /api/users/me
      // fetch itself failing) leaves the button stuck on "Logging in…"
      // forever with no feedback — confirmed while debugging this fix.
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-text-primary text-2xl font-medium mb-6">Log in</h1>

        {successMessage && <p className="text-success text-sm">{successMessage}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-primary text-sm hover:underline">
            Forgot password?
          </Link>
        </div>

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
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <p className="text-text-secondary text-sm text-center">
          Don&apos;t have an account?{" "}
          <Link href="/join" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}

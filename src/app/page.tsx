import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-text-primary text-4xl font-semibold tracking-tight mb-3">
        FleetFlow
      </h1>
      <p className="text-text-secondary text-lg mb-8">
        Last-mile delivery, tracked in real time.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href={currentUser ? "/request" : "/login"}
          className="rounded-lg bg-primary px-6 py-3 text-white font-medium hover:bg-primary/90 transition-colors"
        >
          Request a delivery
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-border px-6 py-3 text-text-primary font-medium hover:bg-surface transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}

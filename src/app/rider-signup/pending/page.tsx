export default function RiderSignupPendingPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md mx-auto rounded-xl border border-border bg-surface p-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-warning text-sm font-mono mb-4">
          <span className="h-2 w-2 rounded-full bg-warning" />
          PENDING REVIEW
        </div>
        <p className="text-text-primary text-lg mb-1">Account created</p>
        <p className="text-text-secondary text-sm">
          We manually verify every rider&apos;s details before activation. This usually
          takes a short while — we&apos;ll notify you once approved.
        </p>
      </div>
    </main>
  );
}

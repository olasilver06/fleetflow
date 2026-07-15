import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">About FleetFlow</h1>
        <p className="text-text-secondary mt-1">What we do, and what we deliberately don&apos;t.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-text-primary font-medium mb-2">A last-mile delivery operations platform</p>
          <p className="text-text-secondary text-sm">
            FleetFlow connects customers who need something delivered with riders who can
            deliver it, and gives operators a live view of everything in between. It&apos;s
            deliberately narrow in scope — not a general logistics or warehouse management
            system. Everything the product does traces back to one pipeline:
          </p>
          <p className="text-text-primary font-mono text-sm mt-4">
            customer request → rider dispatch → delivery → proof → rating
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-text-primary font-medium mb-2">How it works</p>
          <p className="text-text-secondary text-sm">
            A customer requests a delivery and gets an instant price. An admin or the
            system assigns a rider, who accepts the job and carries it from pickup to
            drop-off. The customer can watch the rider&apos;s position on a live map the
            whole way, and the delivery isn&apos;t marked complete until the rider uploads
            photo proof.
          </p>
          <Link
            href="/#how-it-works"
            className="inline-block mt-4 text-primary text-sm font-medium hover:underline"
          >
            See the full breakdown on the homepage
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-text-primary font-medium mb-2">Who it&apos;s for</p>
          <p className="text-text-secondary text-sm">
            Customers who need something delivered and want to see exactly where it is.
            Riders who want delivery jobs with a clear, honest status flow. Admins who need
            a real-time control tower over every order and rider, not a spreadsheet.
          </p>
        </div>
      </div>
    </main>
  );
}

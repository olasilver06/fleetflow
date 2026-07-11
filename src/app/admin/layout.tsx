import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/admin/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fleetflow-horizontal-lockup.svg"
              alt="FleetFlow"
              width={140}
              height={34}
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/admin/dashboard"
              className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/admin/zones"
              className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
            >
              Zones
            </Link>
            <Link
              href="/admin/riders"
              className="text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
            >
              Riders
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

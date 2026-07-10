import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDashboardStats } from "@/lib/services/dashboard-service";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  color = "text-text-primary",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <p className="text-text-secondary text-xs">{label}</p>
      <p className={`text-3xl font-semibold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }
  if (currentUser.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-text-secondary">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const stats = await getDashboardStats();

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Operational snapshot across all orders and riders.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="ACTIVE DELIVERIES"
          value={String(stats.activeDeliveries)}
          color="text-primary"
        />
        <StatCard
          label="PENDING DELIVERIES"
          value={String(stats.pendingDeliveries)}
          color="text-warning"
        />
        <StatCard
          label="COMPLETED TODAY"
          value={String(stats.completedToday)}
          color="text-success"
        />
        <StatCard
          label="FAILED DELIVERIES"
          value={String(stats.failedDeliveries)}
          color="text-danger"
        />
        <StatCard
          label="AVAILABLE RIDERS"
          value={String(stats.availableRiders)}
          color="text-success"
        />
        <StatCard
          label="RIDERS DELIVERING"
          value={String(stats.ridersDelivering)}
          color="text-accent"
        />
        <StatCard label="REVENUE TODAY" value={formatNaira(stats.revenueToday)} />
        <StatCard
          label="AVG DELIVERY TIME"
          value={
            stats.avgDeliveryTimeMinutes === null
              ? "No data yet"
              : `${Math.round(stats.avgDeliveryTimeMinutes)}m`
          }
        />
      </div>
    </main>
  );
}

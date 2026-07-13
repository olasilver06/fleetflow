import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import OrderStatusControl from "@/components/rider/OrderStatusControl";
import RiderNav from "@/components/rider/RiderNav";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const BADGE_STYLES: Record<string, string> = {
  ASSIGNED: "bg-primary/10 text-primary",
  RIDER_ACCEPTED: "bg-primary/10 text-primary",
  PICKED_UP: "bg-accent/10 text-accent",
  IN_TRANSIT: "bg-accent/10 text-accent",
};

const BADGE_LABELS: Record<string, string> = {
  ASSIGNED: "ASSIGNED",
  RIDER_ACCEPTED: "ACCEPTED",
  PICKED_UP: "PICKED UP",
  IN_TRANSIT: "IN TRANSIT",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-mono ${
        BADGE_STYLES[status] ?? "bg-neutral/10 text-neutral"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {BADGE_LABELS[status] ?? status}
    </span>
  );
}

export default async function RiderJobsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }
  if (currentUser.role !== "RIDER" || !currentUser.rider) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-text-secondary">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      status: { in: ["ASSIGNED", "RIDER_ACCEPTED", "PICKED_UP", "IN_TRANSIT"] },
      delivery: { riderId: currentUser.rider.id },
    },
    include: { customer: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <RiderNav />
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-text-primary text-2xl font-medium">Your jobs</h1>
          <p className="text-text-secondary mt-1">Active deliveries assigned to you.</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {orders.length === 0 && (
            <p className="text-text-secondary">No active jobs right now.</p>
          )}

          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-surface p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-text-primary">
                    {order.orderNumber}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-text-primary text-sm">
                  {order.pickupAddress} <span className="text-text-secondary">→</span>{" "}
                  {order.dropoffAddress}
                </p>
                <p className="text-text-secondary text-xs mt-1">
                  {order.customer.user.name}
                </p>
              </div>

              <OrderStatusControl orderId={order.id} status={order.status} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const BADGE_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  ASSIGNED: "bg-primary/10 text-primary",
  RIDER_ACCEPTED: "bg-primary/10 text-primary",
  PICKED_UP: "bg-accent/10 text-accent",
  IN_TRANSIT: "bg-accent/10 text-accent",
  DELIVERED: "bg-success/10 text-success",
  COMPLETED: "bg-success/10 text-success",
  REJECTED_BY_RIDER: "bg-danger/10 text-danger",
  DELIVERY_FAILED: "bg-danger/10 text-danger",
  RETURNED_TO_SENDER: "bg-danger/10 text-danger",
  CANCELLED: "bg-danger/10 text-danger",
};

const BADGE_LABELS: Record<OrderStatus, string> = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  RIDER_ACCEPTED: "ACCEPTED",
  PICKED_UP: "PICKED UP",
  IN_TRANSIT: "IN TRANSIT",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  REJECTED_BY_RIDER: "REJECTED",
  DELIVERY_FAILED: "FAILED",
  RETURNED_TO_SENDER: "RETURNED",
  CANCELLED: "CANCELLED",
};

const TIMELINE_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  RIDER_ACCEPTED: "Rider accepted",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REJECTED_BY_RIDER: "Rejected by rider",
  DELIVERY_FAILED: "Delivery failed",
  RETURNED_TO_SENDER: "Returned to sender",
  CANCELLED: "Cancelled",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-mono ${BADGE_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {BADGE_LABELS[status]}
    </span>
  );
}

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CustomerOrdersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }
  if (currentUser.role !== "CUSTOMER" || !currentUser.customer) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-text-secondary">You don&apos;t have access to this page.</p>
      </main>
    );
  }

  const orders = await prisma.order.findMany({
    where: { customerId: currentUser.customer.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      statusHistory: { orderBy: { createdAt: "asc" } },
      delivery: { include: { rider: { include: { user: true } } } },
    },
  });

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">My orders</h1>
        <p className="text-text-secondary mt-1">Track the status of your deliveries.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {orders.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-text-secondary mb-4">
              You haven&apos;t requested any deliveries yet.
            </p>
            <Link
              href="/request"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Request a delivery
            </Link>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-border bg-surface p-6">
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
                {order.delivery?.rider
                  ? `Rider: ${order.delivery.rider.user.name}`
                  : "Not yet assigned"}
              </p>
            </div>

            <ol className="mt-4 space-y-2 border-l border-border pl-4">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <span className="text-text-primary">{TIMELINE_LABELS[entry.status]}</span>
                  <span className="text-text-secondary"> — </span>
                  <span className="font-mono text-text-secondary text-xs">
                    {formatTimestamp(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </main>
  );
}

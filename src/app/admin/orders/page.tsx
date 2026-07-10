import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import AssignRiderControl from "@/components/admin/AssignRiderControl";
import { formatNaira } from "@/lib/format";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const BADGE_STYLES: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning",
  REJECTED_BY_RIDER: "bg-danger/10 text-danger",
  DELIVERY_FAILED: "bg-danger/10 text-danger",
};

const BADGE_LABELS: Record<string, string> = {
  PENDING: "PENDING",
  REJECTED_BY_RIDER: "REJECTED",
  DELIVERY_FAILED: "FAILED",
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

export default async function AdminOrdersPage() {
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

  const [orders, riders] = await Promise.all([
    prisma.order.findMany({
      where: {
        deletedAt: null,
        status: { in: ["PENDING", "REJECTED_BY_RIDER", "DELIVERY_FAILED"] },
      },
      include: { customer: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.rider.findMany({
      where: { deletedAt: null, availability: "AVAILABLE" },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const riderOptions = riders.map((rider) => ({
    id: rider.id,
    name: rider.user.name,
  }));

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">Unassigned orders</h1>
        <p className="text-text-secondary mt-1">
          Orders waiting for a rider — assign one to move them forward.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {orders.length === 0 && (
          <p className="text-text-secondary">No orders need attention right now.</p>
        )}

        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-border bg-surface p-6 flex items-center justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-text-primary">
                  {order.orderNumber}
                </span>
                <StatusBadge status={order.status} />
                <span className="text-text-secondary text-sm">{formatNaira(order.price)}</span>
              </div>
              <p className="text-text-primary text-sm">
                {order.pickupAddress} <span className="text-text-secondary">→</span>{" "}
                {order.dropoffAddress}
              </p>
              <p className="text-text-secondary text-xs mt-1">
                {order.customer.user.name}
              </p>
            </div>

            <AssignRiderControl orderId={order.id} riders={riderOptions} />
          </div>
        ))}
      </div>
    </main>
  );
}

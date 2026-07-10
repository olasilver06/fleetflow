import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import TrackingMap from "@/components/customer/TrackingMapLoader";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: { include: { rider: { include: { user: true } } } } },
  });

  if (!order || order.deletedAt || order.customerId !== currentUser.customer.id) {
    notFound();
  }

  let initialRiderPosition: { lat: number; lng: number } | null = null;
  if (order.status === "IN_TRANSIT" && order.delivery?.riderId) {
    const latest = await prisma.riderLocation.findFirst({
      where: { riderId: order.delivery.riderId },
      orderBy: { recordedAt: "desc" },
    });
    if (latest) {
      initialRiderPosition = { lat: latest.lat, lng: latest.lng };
    }
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-text-primary text-2xl font-medium">
          Tracking <span className="font-mono">{order.orderNumber}</span>
        </h1>
        <p className="text-text-secondary mt-1">
          {order.pickupAddress} <span className="text-text-secondary">→</span>{" "}
          {order.dropoffAddress}
        </p>
      </div>

      <div className="max-w-4xl mx-auto rounded-xl border border-border bg-surface overflow-hidden">
        <TrackingMap
          pickup={{ lat: order.pickupLat, lng: order.pickupLng }}
          dropoff={{ lat: order.dropoffLat, lng: order.dropoffLng }}
          isInTransit={order.status === "IN_TRANSIT"}
          riderId={order.delivery?.riderId ?? null}
          riderName={order.delivery?.rider?.user.name ?? null}
          initialRiderPosition={initialRiderPosition}
        />
      </div>
    </main>
  );
}

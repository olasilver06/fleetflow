import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    activeDeliveries,
    pendingDeliveries,
    completedToday,
    failedDeliveries,
    availableRiders,
    ridersDelivering,
    revenueTodayResult,
    completedDeliveries,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        deletedAt: null,
        status: { in: ["ASSIGNED", "RIDER_ACCEPTED", "PICKED_UP", "IN_TRANSIT"] },
      },
    }),
    prisma.order.count({
      where: { deletedAt: null, status: "PENDING" },
    }),
    prisma.order.count({
      where: {
        deletedAt: null,
        status: { in: ["DELIVERED", "COMPLETED"] },
        updatedAt: { gte: startOfDay },
      },
    }),
    prisma.order.count({
      where: {
        deletedAt: null,
        status: { in: ["DELIVERY_FAILED", "RETURNED_TO_SENDER"] },
      },
    }),
    prisma.rider.count({
      where: { deletedAt: null, availability: "AVAILABLE" },
    }),
    prisma.rider.count({
      where: { deletedAt: null, availability: "BUSY" },
    }),
    prisma.order.aggregate({
      where: {
        deletedAt: null,
        status: { in: ["DELIVERED", "COMPLETED"] },
        updatedAt: { gte: startOfDay },
      },
      _sum: { price: true },
    }),
    prisma.delivery.findMany({
      where: {
        deletedAt: null,
        assignedAt: { not: null },
        deliveredAt: { not: null },
      },
      select: { assignedAt: true, deliveredAt: true },
    }),
  ]);

  const revenueToday = revenueTodayResult._sum.price ?? 0;

  const avgDeliveryTimeMinutes =
    completedDeliveries.length === 0
      ? null
      : completedDeliveries.reduce((sum, delivery) => {
          const minutes =
            (delivery.deliveredAt!.getTime() - delivery.assignedAt!.getTime()) / 1000 / 60;
          return sum + minutes;
        }, 0) / completedDeliveries.length;

  return {
    activeDeliveries,
    pendingDeliveries,
    completedToday,
    failedDeliveries,
    availableRiders,
    ridersDelivering,
    revenueToday,
    avgDeliveryTimeMinutes,
  };
}

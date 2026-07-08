import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertValidTransition } from "@/lib/services/order-state-machine";

// Reaching any of these statuses means the assigned rider is no longer
// actively working this order — free them back up for new assignments.
const STATUSES_THAT_FREE_THE_RIDER: OrderStatus[] = [
  "REJECTED_BY_RIDER",
  "DELIVERY_FAILED",
  "DELIVERED",
  "CANCELLED",
];

export async function transitionOrderStatusInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: OrderStatus,
  changedByUserId: string,
  note?: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });
  if (!order || order.deletedAt) {
    throw new Error("Order not found");
  }

  assertValidTransition(order.status, status);

  const updated = await tx.order.update({
    where: { id: orderId },
    data: { status },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      previousStatus: order.status,
      status,
      changedByUserId,
      note,
    },
  });

  if (STATUSES_THAT_FREE_THE_RIDER.includes(status) && order.delivery?.riderId) {
    await tx.rider.update({
      where: { id: order.delivery.riderId },
      data: { availability: "AVAILABLE" },
    });
  }

  return updated;
}

export async function transitionOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedByUserId: string,
  note?: string
) {
  return prisma.$transaction((tx) =>
    transitionOrderStatusInTx(tx, orderId, status, changedByUserId, note)
  );
}

export async function assignRiderToOrder(
  orderId: string,
  riderId: string,
  assignedByUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.deletedAt) {
      throw new Error("Order not found");
    }

    assertValidTransition(order.status, "ASSIGNED");

    const rider = await tx.rider.findUnique({ where: { id: riderId } });
    if (!rider || rider.deletedAt) {
      throw new Error("Rider not found");
    }
    if (rider.availability !== "AVAILABLE") {
      throw new Error("Rider is not available");
    }

    await tx.delivery.upsert({
      where: { orderId },
      create: {
        orderId,
        riderId,
        assignedByUserId,
        assignedAt: new Date(),
      },
      update: {
        riderId,
        assignedByUserId,
        assignedAt: new Date(),
      },
    });

    await tx.rider.update({
      where: { id: riderId },
      data: { availability: "BUSY" },
    });

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "ASSIGNED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.status,
        status: "ASSIGNED",
        changedByUserId: assignedByUserId,
      },
    });

    return updated;
  });
}

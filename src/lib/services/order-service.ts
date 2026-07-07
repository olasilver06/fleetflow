import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertValidTransition } from "@/lib/services/order-state-machine";

export async function transitionOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedByUserId: string,
  note?: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
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

    return updated;
  });
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { transitionOrderStatus } from "@/lib/services/order-service";
import type { OrderStatus } from "@prisma/client";

const VALID_STATUSES: OrderStatus[] = [
  "PENDING",
  "ASSIGNED",
  "RIDER_ACCEPTED",
  "REJECTED_BY_RIDER",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "DELIVERY_FAILED",
  "RETURNED_TO_SENDER",
  "CANCELLED",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;
  const body = await request.json();
  const status = body?.status;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (user.role === "RIDER") {
    if (!user.rider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });
    if (!order || order.deletedAt) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.delivery?.riderId !== user.rider.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const order = await transitionOrderStatus(orderId, status as OrderStatus, user.id);
    return NextResponse.json(order);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Couldn't update order status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { transitionOrderStatusInTx } from "@/lib/services/order-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CUSTOMER" || !user.customer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });

  if (!order || order.deletedAt) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.customerId !== user.customer.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Order must be DELIVERED to be rated" },
      { status: 409 }
    );
  }

  if (!order.delivery?.riderId) {
    return NextResponse.json({ error: "Order has no assigned rider" }, { status: 409 });
  }
  const riderId = order.delivery.riderId;

  const body = await request.json();
  const rating = body?.rating;
  const comment =
    typeof body?.comment === "string" && body.comment.trim() ? body.comment.trim() : null;

  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be an integer from 1 to 5" },
      { status: 400 }
    );
  }

  try {
    const [customerRating, updatedOrder] = await prisma.$transaction(async (tx) => {
      const customerRating = await tx.customerRating.create({
        data: {
          orderId,
          customerId: user.customer!.id,
          riderId,
          rating,
          comment,
        },
      });

      const updatedOrder = await transitionOrderStatusInTx(
        tx,
        orderId,
        "COMPLETED",
        user.id
      );

      const aggregate = await tx.customerRating.aggregate({
        where: { riderId },
        _avg: { rating: true },
      });

      await tx.rider.update({
        where: { id: riderId },
        data: {
          completedDeliveries: { increment: 1 },
          averageRating: aggregate._avg.rating ?? rating,
        },
      });

      return [customerRating, updatedOrder] as const;
    });

    return NextResponse.json({ rating: customerRating, order: updatedOrder }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "This order has already been rated" }, { status: 409 });
    }
    const message = e instanceof Error ? e.message : "Couldn't submit rating";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/get-current-user";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (user.role !== "CUSTOMER" || !user.customer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    pickupAddress, pickupLat, pickupLng,
    dropoffAddress, dropoffLat, dropoffLng,
    packageDescription, weightKg, zoneId,
  } = body;

  if (!pickupAddress || !dropoffAddress || pickupLat == null || dropoffLat == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const price = 1500;
  const orderNumber = `FF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: user.customer.id,
      zoneId: zoneId ?? null,
      pickupAddress, pickupLat, pickupLng,
      dropoffAddress, dropoffLng, dropoffLat,
      packageDescription, weightKg, price,
      createdByUserId: user.id,
      statusHistory: { create: { status: "PENDING", changedByUserId: user.id } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}

export async function GET() {
  const user = await requireUser();

  if (user.role === "CUSTOMER" && user.customer) {
    const orders = await prisma.order.findMany({
      where: { customerId: user.customer.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  if (user.role === "ADMIN") {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(orders);
  }

  if (user.role === "RIDER" && user.rider) {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null, delivery: { riderId: user.rider.id } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

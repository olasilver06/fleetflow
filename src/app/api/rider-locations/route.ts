import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "RIDER" || !user.rider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activeDeliveries = await prisma.delivery.findMany({
    where: {
      riderId: user.rider.id,
      deletedAt: null,
      order: { status: "IN_TRANSIT", deletedAt: null },
    },
  });

  if (activeDeliveries.length !== 1) {
    return NextResponse.json(
      { error: "Rider must have exactly one active IN_TRANSIT delivery to share location" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const { lat, lng, heading, speed } = body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "lat and lng are required numbers" }, { status: 400 });
  }

  const location = await prisma.riderLocation.create({
    data: {
      riderId: user.rider.id,
      lat,
      lng,
      heading: typeof heading === "number" ? heading : null,
      speed: typeof speed === "number" ? speed : null,
    },
  });

  return NextResponse.json(location, { status: 201 });
}

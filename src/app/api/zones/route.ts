import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zones = await prisma.deliveryZone.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(zones);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, baseFee } = body;

  if (typeof name !== "string" || !name.trim() || typeof baseFee !== "number") {
    return NextResponse.json({ error: "name and baseFee are required" }, { status: 400 });
  }

  try {
    const zone = await prisma.deliveryZone.create({
      data: { name: name.trim(), baseFee },
    });
    return NextResponse.json(zone, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "A zone with this name already exists" }, { status: 409 });
    }
    throw e;
  }
}

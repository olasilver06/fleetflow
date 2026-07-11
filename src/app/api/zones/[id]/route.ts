import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, baseFee } = body;

  const data: { name?: string; baseFee?: number } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (baseFee !== undefined) {
    if (typeof baseFee !== "number") {
      return NextResponse.json({ error: "baseFee must be a number" }, { status: 400 });
    }
    data.baseFee = baseFee;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const zone = await prisma.deliveryZone.update({ where: { id }, data });
    return NextResponse.json(zone);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Zone not found" }, { status: 404 });
      }
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "A zone with this name already exists" },
          { status: 409 }
        );
      }
    }
    throw e;
  }
}

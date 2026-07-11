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
  const { baseFee, perKmRate, weightSurchargeRate, isActive } = body;

  const data: {
    baseFee?: number;
    perKmRate?: number | null;
    weightSurchargeRate?: number | null;
    isActive?: boolean;
  } = {};

  if (baseFee !== undefined) {
    if (typeof baseFee !== "number") {
      return NextResponse.json({ error: "baseFee must be a number" }, { status: 400 });
    }
    data.baseFee = baseFee;
  }
  if (perKmRate !== undefined) {
    if (perKmRate !== null && typeof perKmRate !== "number") {
      return NextResponse.json(
        { error: "perKmRate must be a number or null" },
        { status: 400 }
      );
    }
    data.perKmRate = perKmRate;
  }
  if (weightSurchargeRate !== undefined) {
    if (weightSurchargeRate !== null && typeof weightSurchargeRate !== "number") {
      return NextResponse.json(
        { error: "weightSurchargeRate must be a number or null" },
        { status: 400 }
      );
    }
    data.weightSurchargeRate = weightSurchargeRate;
  }
  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }
    data.isActive = isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const rule = await prisma.pricingRule.update({
      where: { id },
      data,
      include: { zone: true },
    });
    return NextResponse.json(rule);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Pricing rule not found" }, { status: 404 });
    }
    throw e;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rules = await prisma.pricingRule.findMany({
    include: { zone: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
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
  const { zoneId, baseFee, perKmRate, weightSurchargeRate, isActive } = body;

  if (zoneId !== null && typeof zoneId !== "string") {
    return NextResponse.json(
      { error: "zoneId is required (or null for the global default)" },
      { status: 400 }
    );
  }
  if (typeof baseFee !== "number") {
    return NextResponse.json({ error: "baseFee is required" }, { status: 400 });
  }

  if (zoneId) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }
  }

  const rule = await prisma.pricingRule.create({
    data: {
      zoneId: zoneId ?? null,
      baseFee,
      perKmRate: typeof perKmRate === "number" ? perKmRate : null,
      weightSurchargeRate: typeof weightSurchargeRate === "number" ? weightSurchargeRate : null,
      isActive: typeof isActive === "boolean" ? isActive : true,
    },
    include: { zone: true },
  });

  return NextResponse.json(rule, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_VEHICLE_TYPES = ["BIKE", "VAN", "TRUCK"];

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
  if (existing) {
    return NextResponse.json({ error: "Profile already completed" }, { status: 400 });
  }

  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const role = body?.role;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (role !== "CUSTOMER" && role !== "RIDER") {
    return NextResponse.json({ error: "role must be CUSTOMER or RIDER" }, { status: 400 });
  }

  if (role === "RIDER") {
    const vehicleType = body?.vehicleType;
    if (typeof vehicleType !== "string" || !VALID_VEHICLE_TYPES.includes(vehicleType)) {
      return NextResponse.json(
        { error: "vehicleType must be one of BIKE, VAN, TRUCK" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email!,
        name,
        role: "RIDER",
        rider: {
          create: {
            vehicleType: vehicleType as "BIKE" | "VAN" | "TRUCK",
            availability: "OFFLINE",
            verificationStatus: "PENDING",
          },
        },
      },
      include: { rider: true },
    });

    return NextResponse.json(user, { status: 201 });
  }

  const user = await prisma.user.create({
    data: {
      supabaseId: authUser.id,
      email: authUser.email!,
      name,
      role: "CUSTOMER",
      customer: { create: {} },
    },
    include: { customer: true },
  });

  return NextResponse.json(user, { status: 201 });
}
